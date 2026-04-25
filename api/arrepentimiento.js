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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en un minuto.' })

  const { nombre, email, telefono, nro_operacion, motivo } = req.body || {}
  if (!nombre || !email || !nro_operacion) return res.status(400).json({ error: 'Faltan datos' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' })
  if (nombre.length > 200 || (motivo && motivo.length > 2000)) return res.status(400).json({ error: 'Datos demasiado largos' })

  const sNombre = sanitize(nombre)
  const sEmail = sanitize(email)
  const sTelefono = telefono ? sanitize(telefono) : null
  const sOperacion = sanitize(nro_operacion)
  const sMotivo = motivo ? sanitize(motivo) : null

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rlautomotores24@gmail.com'

  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

  await fetch(`${supabaseUrl}/rest/v1/arrepentimientos`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify({ nombre, email, telefono: telefono || null, nro_operacion, motivo: motivo || null }),
  })

  if (RESEND_KEY) {
    await fetch('https://api.resend.com/emails', {
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
                <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em;width:140px">Nombre</td><td style="padding:8px 0;font-weight:bold">${sNombre}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Email</td><td style="padding:8px 0;color:#e63329">${sEmail}</td></tr>
                ${sTelefono ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Teléfono</td><td style="padding:8px 0">${sTelefono}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Nro. Operación</td><td style="padding:8px 0;font-weight:bold">${sOperacion}</td></tr>
                ${sMotivo ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Motivo</td><td style="padding:8px 0">${sMotivo}</td></tr>` : ''}
              </table>
              <div style="margin-top:24px;padding:16px;background:#1a1a1a;border-radius:8px;font-size:13px;color:#888">
                Plazo legal: hasta 10 días desde la celebración del contrato (Res. 424/2020). Contactar al cliente en las próximas 24 hs hábiles.
              </div>
            </div>
          </div>`,
      }),
    })
  }

  res.json({ ok: true })
}
