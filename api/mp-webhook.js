import crypto from 'crypto'
import { PRECIOS } from './_lib/precios.js'

function verifyMpSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return false // nunca permitir bypass

  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']

  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map(p => p.split('='))
  )

  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) return false

  // 🔒 Evitar replay attacks (5 minutos)
  const now = Date.now()
  const tsMs = Number(ts)
  if (Math.abs(now - tsMs) > 5 * 60 * 1000) return false

  const dataId = req.body?.data?.id ?? req.query.id ?? ''
  if (!dataId) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  const sig = Buffer.from(v1, 'hex')
  const exp = Buffer.from(expected, 'hex')

  if (sig.length !== exp.length) return false

  return crypto.timingSafeEqual(sig, exp)
}

async function safeFetch(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fetch error: ${res.status} - ${text}`)
  }
  return res.json().catch(() => ({}))
}

// PRECIOS_ESPERADOS deriva del módulo compartido (single source of truth)
const PRECIOS_ESPERADOS = Object.fromEntries(
  Object.entries(PRECIOS).map(([k, v]) => [k, v.monto])
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!verifyMpSignature(req)) {
    console.warn('mp-webhook: invalid signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const topic = req.query.topic || req.body?.type
  const id = req.query.id || req.body?.data?.id

  // 🔒 Validación de Formato de ID (Evita que inyecten paths en el fetch a MP)
  if (!id || (topic !== 'payment' && topic !== 'payment.updated')) {
    return res.status(200).json({ received: true })
  }

  if (!/^\d+$/.test(String(id))) {
    return res.status(400).json({ error: 'Formato de ID inválido' })
  }

  try {
    const payment = await safeFetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    )

    // 🔒 Validación estricta de pago
    if (
      payment.status !== 'approved' ||
      payment.status_detail !== 'accredited'
    ) {
      return res.status(200).json({ received: true, status: payment.status })
    }

    const {
      tipo,
      auto_id,
      concesionaria_id,
      profesional_id,
      user_id,
      user_email,
    } = payment.metadata || {}

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }

    // Helper para registrar pagos cobrados pero NO aplicables (fraude, ownership, etc).
    // Requiere tabla `pagos_rechazados` (ver docs SQL). Si no existe, sólo loguea.
    async function registrarRechazado(motivo) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/pagos_rechazados`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            mp_payment_id: String(id),
            tipo: tipo || null,
            motivo,
            monto: payment.transaction_amount,
            metadata: payment.metadata || {},
            payer_email: payment.payer?.email || null,
          }),
        })
      } catch (e) {
        console.error('[mp-webhook] no se pudo registrar rechazado:', e.message)
      }
    }

    // 🚨 VALIDACIÓN CRÍTICA CONTRA MANIPULACIÓN DE PRECIOS
    const precioEsperado = PRECIOS_ESPERADOS[tipo]
    if (precioEsperado === undefined) {
      console.error(`🚨 ALERTA: Tipo de pago desconocido "${tipo}"`)
      await registrarRechazado('tipo_desconocido')
      return res.status(200).json({ error: 'Tipo de pago no reconocido' })
    }
    if (payment.transaction_amount < precioEsperado) {
      console.error(`🚨 ALERTA FRAUDE: Monto insuficiente. Pagó ${payment.transaction_amount} por ${tipo}`)
      await registrarRechazado('monto_insuficiente')
      return res.status(200).json({ error: 'Monto insuficiente para el servicio' })
    }

    // 🔒 IDEMPOTENCIA MEJORADA
    const existing = await safeFetch(
      `${supabaseUrl}/rest/v1/pagos?mp_payment_id=eq.${id}`,
      { headers }
    )

    if (existing.length > 0) {
      return res.status(200).json({ received: true, duplicated: true })
    }

    const in30days = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    // 🔒 SANEAMIENTO Y VALIDACIÓN DE OWNERSHIP COMPLETA
    if (auto_id) {
      const safeAutoId = encodeURIComponent(auto_id);
      const autos = await safeFetch(
        `${supabaseUrl}/rest/v1/autos?id=eq.${safeAutoId}`,
        { headers }
      )

      if (!autos.length) {
        console.warn(`Webhook ignorado: Auto ${auto_id} no existe`);
        await registrarRechazado('auto_no_existe')
        return res.status(200).json({ error: 'Auto not found' })
      }

      const autoTarget = autos[0]

      if (concesionaria_id && autoTarget.concesionaria_id !== concesionaria_id) {
        await registrarRechazado('ownership_mismatch_concesionaria')
        return res.status(200).json({ error: 'Ownership mismatch (Concesionaria)' })
      } else if (!concesionaria_id && user_id && autoTarget.user_id !== user_id) {
        await registrarRechazado('ownership_mismatch_user')
        return res.status(200).json({ error: 'Ownership mismatch (Usuario particular)' })
      }
    }

    // 🔒 IDEMPOTENCIA REAL: insertamos la marca de "procesado" ANTES de
    // cualquier efecto secundario (PATCH de boost, RPC de cupos, plan). El
    // chequeo de arriba (SELECT) es sólo un atajo para el caso común
    // (reintento secuencial); la garantía real contra dos entregas casi
    // simultáneas la da la restricción UNIQUE en pagos.mp_payment_id (ver
    // docs/migration_idempotencia_pagos_2026_07.sql): si dos requests llegan
    // a la vez, sólo uno logra insertar acá y el otro recibe 409 y corta
    // antes de acreditar el pago dos veces.
    const insertPagoRes = await fetch(`${supabaseUrl}/rest/v1/pagos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mp_payment_id: String(id),
        tipo,
        auto_id: auto_id || null,
        concesionaria_id: concesionaria_id || null,
        profesional_id: profesional_id || null,
        user_id: user_id || null,
        monto: payment.transaction_amount,
        estado: payment.status,
      }),
    })

    if (insertPagoRes.status === 409) {
      return res.status(200).json({ received: true, duplicated: true })
    }
    if (!insertPagoRes.ok) {
      const text = await insertPagoRes.text()
      throw new Error(`Fetch error: ${insertPagoRes.status} - ${text}`)
    }

    // 🔧 PATCH SEGÚN TIPO (Modificaciones directas a un auto_id)
    const patchMap = {
      destacado: { destacado: true, urgente: false, destacado_expira_at: in30days },
      urgente: { urgente: true, destacado: false, urgente_expira_at: in30days },
      fijado_home: { fijado_home: true },
      destacado_individual: { destacado: true, urgente: false, destacado_expira_at: in30days },
      urgente_individual: { urgente: true, destacado: false, urgente_expira_at: in30days },
      subir_tope: { created_at: new Date().toISOString() },
      renovar: { created_at: new Date().toISOString() },
    }

    if (patchMap[tipo] && auto_id) {
      await safeFetch(`${supabaseUrl}/rest/v1/autos?id=eq.${encodeURIComponent(auto_id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchMap[tipo]),
      })
    }

    if (tipo === 'banner_home' && concesionaria_id) {
      await safeFetch(
        `${supabaseUrl}/rest/v1/concesionarias?id=eq.${encodeURIComponent(concesionaria_id)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ banner_activo: true }),
        }
      )
    }

    // 🎁 INCREMENTO DE CUPOS (Llamadas RPC en Supabase para Concesionarias)
    if (tipo === 'pack_destacados_10' && concesionaria_id) {
      await safeFetch(`${supabaseUrl}/rest/v1/rpc/incrementar_cupo_destacados`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_concesionaria_id: concesionaria_id, cantidad: 10 }),
      })
    }

    // 🔧 PLANES PROFESIONALES
    if (['plan_profesional_base', 'plan_profesional_destacado'].includes(tipo) && profesional_id) {
      const esDestacado = tipo === 'plan_profesional_destacado'
      await safeFetch(
        `${supabaseUrl}/rest/v1/profesionales?id=eq.${encodeURIComponent(profesional_id)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            plan: esDestacado ? 'destacado' : 'base',
            destacado: esDestacado,
            plan_vence_at: esDestacado ? in30days : null,
          }),
        }
      )
    }

    // 📧 EMAIL (Protegido para que no rompa el webhook)
    if (user_email && process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'FIORA MARKET <noreply@fioramarket.store>',
            to: [user_email],
            subject: '✅ Pago confirmado – FIORA MARKET',
            html: `<p>Tu pago fue confirmado correctamente.</p>`,
          }),
        })
      } catch (emailErr) {
        console.error('Email failed to send:', emailErr);
      }
    }

    res.status(200).json({ received: true, processed: true })
  } catch (err) {
    console.error('mp-webhook error:', err)
    // ⚠️ ALERTA: Retornamos 500 para errores internos críticos (ej. fallo de red con Supabase)
    // Así MercadoPago interpreta que hubo una falla nuestra y vuelve a enviar el webhook en unos minutos.
    res.status(500).json({ error: 'Internal Server Error' })
  }
}