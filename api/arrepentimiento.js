const ALLOWED_ORIGIN = 'https://fioramarket.store'

const rateLimit = new Map()
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 3

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now - entry.start > WINDOW_MS) {
    rateLimit.set(ip, { count: 1, start: now })
    return true
  }
  if (entry.count >= MAX_REQUESTS) return false
  entry.count++
  return true
}

function sanitize(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 500)
}

/**
 * Calcula la fecha límite de resolución excluyendo sábados y domingos.
 * No incluye feriados nacionales (requeriría una API externa).
 * @param {Date} desde
 * @param {number} diasHabiles
 * @returns {string} ISO timestamp
 */
function calcularFechaLimite(desde, diasHabiles) {
  const d = new Date(desde)
  let count = 0
  while (count < diasHabiles) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++ // excluir sábado (6) y domingo (0)
  }
  return d.toISOString()
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en un minuto.' })

  const { nombre, email, telefono, nro_operacion, motivo, fecha_operacion, monto_pagado, user_id } = req.body || {}
  if (!nombre || !email || !nro_operacion) return res.status(400).json({ error: 'Faltan datos' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' })
  if (nombre.length > 200 || (motivo && motivo.length > 2000)) return res.status(400).json({ error: 'Datos demasiado largos' })

  // Validar monto_pagado: debe ser número positivo si se provee
  const montoValidado = monto_pagado && !isNaN(Number(monto_pagado)) && Number(monto_pagado) > 0
    ? Number(monto_pagado)
    : null

  const sNombre = sanitize(nombre)
  const sEmail = sanitize(email)
  const sTelefono = telefono ? sanitize(telefono) : null
  const sOperacion = sanitize(nro_operacion)
  const sMotivo = motivo ? sanitize(motivo) : null

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rlautomotores24@gmail.com'

  const sbHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation', // FIX HALLAZGO 1: necesitamos el registro insertado
  }

  const ahora = new Date()
  const fechaLimite = calcularFechaLimite(ahora, 10)

  // ─────────────────────────────────────────────────────────────────────────────
  // HALLAZGO 1 FIX: Verificar que el INSERT en DB fue exitoso ANTES de responder.
  // Si falla, retornar 500 — no emitir "ok: true" sin registro legal confirmado.
  // ─────────────────────────────────────────────────────────────────────────────
  let dbTimestamp = null
  let registroId = null
  try {
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/arrepentimientos`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify({
        nombre,
        email,
        telefono: telefono || null,
        nro_operacion,
        motivo: motivo || null,
        fecha_operacion: fecha_operacion || null,
        // Hallazgo 3 FIX: campos auditables
        estado: 'pendiente',
        monto_pagado: montoValidado,         // ← importe real de la operación
        user_id: user_id || null,            // ← trazabilidad del usuario logueado
        ip_solicitante: ip,
        created_at: ahora.toISOString(),
        fecha_limite_resolucion: fechaLimite,
      }),
    })

    if (!dbRes.ok) {
      const errBody = await dbRes.text()
      console.error('[arrepentimiento] CRITICAL: DB insert failed —', errBody)
      return res.status(500).json({ error: 'No se pudo registrar la solicitud. Intentá nuevamente o escribinos a contacto@fioramarket.store' })
    }

    const inserted = await dbRes.json()
    const registro = Array.isArray(inserted) ? inserted[0] : inserted
    dbTimestamp = registro?.created_at || ahora.toISOString()
    registroId = registro?.id || null
  } catch (dbErr) {
    console.error('[arrepentimiento] CRITICAL: DB exception —', dbErr.message)
    return res.status(500).json({ error: 'Error interno al registrar la solicitud. Intentá más tarde.' })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HALLAZGO 2 FIX: El email SIEMPRE se intenta. Si RESEND_KEY no existe o falla,
  // se loguea como error crítico pero NO se bloquea — la DB ya tiene el registro legal.
  // ─────────────────────────────────────────────────────────────────────────────
  if (!RESEND_KEY) {
    console.error('[arrepentimiento] CRITICAL: RESEND_API_KEY no configurada — comprobante legal NO enviado al usuario. Registro ID:', registroId)
  }

  let emailError = null
  try {
    if (RESEND_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'FIORA MARKET <noreply@fioramarket.store>',
          to: [ADMIN_EMAIL, email],
          subject: `Solicitud de arrepentimiento — Operación ${sOperacion}`,
          html: `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
              <div style="background:#e63329;padding:20px 28px">
                <div style="font-size:20px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
                <div style="font-size:12px;opacity:.8;margin-top:2px">Botón de arrepentimiento — Res. 424/2020</div>
              </div>
              <div style="padding:28px">
                <p style="color:#888;margin-bottom:20px">Se recibió una solicitud de revocación de compra.</p>
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em;width:180px">Nombre</td><td style="padding:8px 0;font-weight:bold">${sNombre}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Email</td><td style="padding:8px 0;color:#e63329">${sEmail}</td></tr>
                  ${sTelefono ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Teléfono</td><td style="padding:8px 0">${sTelefono}</td></tr>` : ''}
                  <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Nro. Operación</td><td style="padding:8px 0;font-weight:bold">${sOperacion}</td></tr>
                  ${sMotivo ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Motivo</td><td style="padding:8px 0">${sMotivo}</td></tr>` : ''}
                  <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">ID Registro</td><td style="padding:8px 0;font-family:monospace;font-size:11px;color:#aaa">${registroId || 'N/A'}</td></tr>
                </table>
                <div style="margin-top:24px;padding:16px;background:#1a1a1a;border-radius:8px;font-size:13px;color:#888">
                  <strong style="color:#f5f3ee;display:block;margin-bottom:8px">Información legal</strong>
                  Solicitud registrada el <strong style="color:#f5f3ee">${new Date(dbTimestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</strong> (UTC-3).<br/>
                  Plazo de resolución: <strong style="color:#e63329">10 días hábiles</strong> — vence el <strong style="color:#f5f3ee">${new Date(fechaLimite).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.<br/><br/>
                  Conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.
                </div>
              </div>
            </div>`,
        }),
      })
      if (!emailRes.ok) emailError = await emailRes.text()
    } else {
      emailError = 'RESEND_KEY no configurada'
    }
  } catch (e) {
    emailError = e.message
  }

  if (emailError) {
    console.error('[arrepentimiento] Email send failed (registro en DB OK, ID:', registroId, ') —', emailError)
    // La DB ya tiene el registro. Notificar al cliente sin bloquear.
    return res.json({ ok: true, warning: 'Solicitud registrada. El comprobante por email puede demorar.' })
  }

  res.json({ ok: true })
}
