// NOTA: Este cron requiere la tabla `alertas_enviadas` en Supabase:
// CREATE TABLE IF NOT EXISTS alertas_enviadas (
//   id          BIGSERIAL PRIMARY KEY,
//   alerta_id   UUID NOT NULL REFERENCES alertas_busqueda(id) ON DELETE CASCADE,
//   auto_id     UUID NOT NULL,
//   enviado_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
//   UNIQUE (alerta_id, auto_id)
// );
// CREATE INDEX IF NOT EXISTS idx_alertas_enviadas_alerta ON alertas_enviadas(alerta_id);
// CREATE INDEX IF NOT EXISTS idx_alertas_activo ON alertas_busqueda(activo) WHERE activo = true;

import { buildUnsubscribeToken } from './_lib/unsubscribe-token.js'

const BATCH_SIZE = 10   // alertas procesadas en paralelo por vez
const BATCH_DELAY_MS = 200 // pausa entre batches (~5 req/s hacia Resend)

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const RESEND_KEY = process.env.RESEND_API_KEY
  const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET

  if (!RESEND_KEY) return res.status(200).json({ ok: false, reason: 'no-resend-key' })
  if (!UNSUB_SECRET) console.warn('[cron-alertas] UNSUBSCRIBE_SECRET no configurada — emails irán sin link de baja')

  // ── 1. Autos publicados en las últimas 24h ────────────────────────────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let nuevosAutos
  try {
    const autosRes = await fetch(
      `${supabaseUrl}/rest/v1/autos?activo=eq.true&created_at=gte.${since}` +
      `&select=id,marca,modelo,anio,kilometraje,precio_ars,combustible,tipo,categoria,concesionaria_id,concesionarias(nombre,ciudad)`,
      { headers: sbHeaders, signal: AbortSignal.timeout(10_000) }
    )
    if (!autosRes.ok) throw new Error(`Supabase /autos error: ${autosRes.status}`)
    nuevosAutos = await autosRes.json()
  } catch (err) {
    console.error('[cron-alertas] Supabase fetch /autos failed:', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }

  if (!Array.isArray(nuevosAutos) || nuevosAutos.length === 0) {
    return res.status(200).json({ ok: true, enviados: 0, motivo: 'sin-autos-nuevos' })
  }

  // ── 2. Alertas activas (solo campos necesarios, con límite) ───────────────
  let alertas
  try {
    const alertasRes = await fetch(
      `${supabaseUrl}/rest/v1/alertas_busqueda?select=id,email,filtros&activo=eq.true&limit=1000`,
      { headers: sbHeaders, signal: AbortSignal.timeout(10_000) }
    )
    if (!alertasRes.ok) throw new Error(`Supabase /alertas_busqueda error: ${alertasRes.status}`)
    alertas = await alertasRes.json()
  } catch (err) {
    console.error('[cron-alertas] Supabase fetch /alertas_busqueda failed:', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }

  if (!Array.isArray(alertas) || alertas.length === 0) {
    return res.status(200).json({ ok: true, enviados: 0, motivo: 'sin-alertas-activas' })
  }

  let enviados = 0
  let errores = 0

  // ── 3. Procesar alertas en batches para respetar rate limit de Resend ─────
  for (let i = 0; i < alertas.length; i += BATCH_SIZE) {
    const batch = alertas.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async (alerta) => {
      const f = alerta.filtros || {}

      // ── 3a. Deduplicación: excluir autos ya notificados para esta alerta ──
      let yaEnviadosIds = new Set()
      try {
        const enviadas = await fetch(
          `${supabaseUrl}/rest/v1/alertas_enviadas?alerta_id=eq.${alerta.id}&select=auto_id`,
          { headers: sbHeaders, signal: AbortSignal.timeout(8_000) }
        )
        if (enviadas.ok) {
          const data = await enviadas.json()
          yaEnviadosIds = new Set((data || []).map(e => e.auto_id))
        }
      } catch (err) {
        console.warn(`[cron-alertas] No se pudo leer alertas_enviadas para alerta ${alerta.id}:`, err.message)
        // Si falla la deduplicación, continuamos de todos modos (mejor enviar que no enviar)
      }

      // ── 3b. Filtrar coincidentes excluyendo ya enviados ───────────────────
      const coincidentes = nuevosAutos.filter(a => {
        if (yaEnviadosIds.has(a.id)) return false
        if (f.tipo && a.tipo !== f.tipo) return false
        if (f.marca && a.marca?.toLowerCase() !== f.marca.toLowerCase()) return false
        if (f.categoria && a.categoria !== f.categoria) return false
        if (f.combustible && a.combustible !== f.combustible) return false
        if (f.precioMax && Number(a.precio_ars) > Number(f.precioMax)) return false
        if (f.precioMin && Number(a.precio_ars) < Number(f.precioMin)) return false
        if (f.anioDesde && Number(a.anio) < Number(f.anioDesde)) return false
        if (f.anioHasta && Number(a.anio) > Number(f.anioHasta)) return false
        if (f.busqueda) {
          const q = f.busqueda.toLowerCase()
          if (!a.marca?.toLowerCase().includes(q) && !a.modelo?.toLowerCase().includes(q)) return false
        }
        return true
      })

      if (coincidentes.length === 0) return

      // ── 3c. Construir email ───────────────────────────────────────────────
      const listHtml = coincidentes.map(a => `
        <div style="border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:12px">
          <div style="font-size:16px;font-weight:700;color:#f5f3ee">${esc(a.marca)} ${esc(a.modelo)} ${esc(a.anio)}</div>
          <div style="font-size:13px;color:#888;margin-top:4px">${a.tipo === 'nuevo' ? 'Nuevo' : 'Usado'} · ${Number(a.kilometraje).toLocaleString('es-AR')} km · ${esc(a.combustible)}</div>
          ${Number(a.precio_ars) > 0 ? `<div style="font-size:18px;font-weight:700;color:#e63329;margin-top:8px">$${Number(a.precio_ars).toLocaleString('es-AR')}</div>` : ''}
          ${a.concesionarias ? `<div style="font-size:12px;color:#666;margin-top:4px">${esc(a.concesionarias.nombre)} · ${esc(a.concesionarias.ciudad)}</div>` : ''}
          <a href="https://fioramarket.store/auto/${encodeURIComponent(a.id)}" style="display:inline-block;margin-top:12px;background:#e63329;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold">Ver vehículo →</a>
        </div>`).join('')

      const labelMap = { tipo: 'Condición', marca: 'Marca', categoria: 'Categoría', combustible: 'Combustible', precioMin: 'Precio mín', precioMax: 'Precio máx', anioDesde: 'Año desde', anioHasta: 'Año hasta', busqueda: 'Búsqueda' }
      const resumen = Object.entries(f)
        .filter(([, v]) => v)
        .map(([k, v]) => labelMap[k] ? `${esc(labelMap[k])}: ${esc(v)}` : null)
        .filter(Boolean).join(' · ')

      // ── 3d. Enviar email con verificación de respuesta ────────────────────
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'FIORA MARKET <noreply@fioramarket.store>',
            to: alerta.email,
            subject: `${coincidentes.length} vehículo${coincidentes.length > 1 ? 's' : ''} nuevo${coincidentes.length > 1 ? 's' : ''} que te puede${coincidentes.length > 1 ? 'n' : ''} interesar`,
            headers: UNSUB_SECRET ? {
              'List-Unsubscribe': `<https://fioramarket.store/api/unsubscribe-alerta?id=${encodeURIComponent(alerta.id)}&t=${buildUnsubscribeToken(alerta.id, UNSUB_SECRET)}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            } : undefined,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
                <div style="background:#e63329;padding:20px 28px">
                  <div style="font-size:20px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
                  <div style="font-size:12px;opacity:.8;margin-top:2px">Alerta de búsqueda</div>
                </div>
                <div style="padding:28px">
                  <div style="font-size:20px;font-weight:700;margin-bottom:6px">${coincidentes.length} vehículo${coincidentes.length > 1 ? 's' : ''} nuevo${coincidentes.length > 1 ? 's' : ''} que coincide${coincidentes.length > 1 ? 'n' : ''} con tu alerta</div>
                  ${resumen ? `<div style="font-size:12px;color:#666;margin-bottom:20px">Filtros: ${resumen}</div>` : ''}
                  ${listHtml}
                  <div style="margin-top:20px;padding-top:20px;border-top:1px solid #1a1a1a;display:flex;gap:10px;flex-wrap:wrap">
                    <a href="https://fioramarket.store/catalogo" style="font-size:13px;color:#e63329;text-decoration:none">Ver catálogo completo →</a>
                    <a href="https://fioramarket.store/mi-cuenta" style="font-size:13px;color:#555;text-decoration:none">Administrar alertas</a>
                  </div>
                  ${UNSUB_SECRET ? `<div style="margin-top:16px;font-size:11px;color:#555;text-align:center">
                    ¿No querés más estos avisos?
                    <a href="https://fioramarket.store/api/unsubscribe-alerta?id=${encodeURIComponent(alerta.id)}&t=${buildUnsubscribeToken(alerta.id, UNSUB_SECRET)}" style="color:#888;text-decoration:underline">Darme de baja</a>
                  </div>` : ''}
                </div>
              </div>`,
          }),
        })

        if (!resendRes.ok) {
          const errBody = await resendRes.json().catch(() => ({}))
          console.error(`[cron-alertas] Resend error para ${alerta.email}: HTTP ${resendRes.status}`, errBody)
          errores++
          return
        }

        // ── 3e. Registrar autos notificados para deduplicación futura ───────
        try {
          await fetch(`${supabaseUrl}/rest/v1/alertas_enviadas`, {
            method: 'POST',
            headers: {
              ...sbHeaders,
              'Content-Type': 'application/json',
              Prefer: 'resolution=ignore-duplicates',
            },
            body: JSON.stringify(coincidentes.map(a => ({ alerta_id: alerta.id, auto_id: a.id }))),
            signal: AbortSignal.timeout(8_000),
          })
        } catch (err) {
          console.warn(`[cron-alertas] No se pudo registrar alertas_enviadas para alerta ${alerta.id}:`, err.message)
        }

        enviados++
      } catch (err) {
        console.error(`[cron-alertas] Fetch Resend falló para ${alerta.email}:`, err.message)
        errores++
      }
    }))

    // Pausa entre batches para respetar rate limit de Resend
    if (i + BATCH_SIZE < alertas.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  res.status(200).json({
    ok: true,
    enviados,
    errores,
    autos_nuevos: nuevosAutos.length,
    alertas_procesadas: alertas.length,
  })
}
