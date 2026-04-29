const ALLOWED_ORIGIN = 'https://fioramarket.store'

// Rate limiting simple en memoria (se resetea con cada cold start de Vercel)
const rateLimit = new Map()
const WINDOW_MS = 60 * 1000  // 1 minuto
const MAX_REQUESTS = 5        // max 5 consultas por IP por minuto

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

function sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 2000)
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en un minuto.' })

  const { auto_id, nombre, email, mensaje, telefono } = req.body
  if (!auto_id || !nombre || !email || !mensaje) return res.status(400).json({ error: 'Faltan datos' })

  // Validar email básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' })
  if (nombre.length > 200 || mensaje.length > 5000) return res.status(400).json({ error: 'Datos demasiado largos' })

  if (!process.env.RESEND_API_KEY) return res.status(200).json({ sent: false, reason: 'no-resend-key' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  // Sanitizar inputs antes de incluirlos en HTML
  const sNombre = sanitizeHtml(nombre)
  const sEmail = sanitizeHtml(email)
  const sMensaje = sanitizeHtml(mensaje)
  const sTelefono = telefono ? sanitizeHtml(telefono) : null

  try {
    const autoRes = await fetch(
      `${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}&select=marca,modelo,concesionaria_id,user_id,concesionarias(email,nombre)`,
      { headers: sbHeaders }
    )
    const [auto] = await autoRes.json()
    if (!auto) return res.status(200).json({ sent: false, reason: 'auto-not-found' })

    let sellerEmail, sellerNombre
    if (auto.concesionaria_id && auto.concesionarias?.email) {
      sellerEmail = auto.concesionarias.email
      sellerNombre = auto.concesionarias.nombre
    } else if (auto.user_id) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${auto.user_id}`, { headers: sbHeaders })
      const userData = await userRes.json()
      sellerEmail = userData.email
      sellerNombre = userData.user_metadata?.nombre || 'Vendedor'
    }

    if (!sellerEmail) return res.status(200).json({ sent: false, reason: 'no-seller-email' })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: [sellerEmail],
        reply_to: sEmail,
        subject: `Nueva consulta sobre tu ${auto.marca} ${auto.modelo} — FIORA MARKET`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
            <div style="background:#e63329;padding:24px 32px">
              <div style="font-size:22px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
            </div>
            <div style="padding:32px">
              <div style="font-size:18px;font-weight:700;margin-bottom:6px">Nueva consulta recibida</div>
              <p style="color:#888;font-size:14px;margin:0 0 24px">Alguien está interesado en tu <strong style="color:#f5f3ee">${auto.marca} ${auto.modelo}</strong>.</p>
              <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:20px">
                <div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Nombre</div>
                <div style="font-size:15px;font-weight:600;margin-bottom:14px">${sNombre}</div>
                <div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Email</div>
                <div style="font-size:15px;margin-bottom:14px"><a href="mailto:${sEmail}" style="color:#e63329">${sEmail}</a></div>
                ${sTelefono ? `<div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Teléfono</div><div style="font-size:15px;margin-bottom:14px">${sTelefono}</div>` : ''}
                <div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Mensaje</div>
                <div style="font-size:14px;color:#aaa;line-height:1.6">${sMensaje}</div>
              </div>
              <p style="color:#555;font-size:13px">Respondé directamente a este email para contactar al interesado.</p>
            </div>
          </div>
        `,
      }),
    })

    res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-consulta error:', err)
    res.status(200).json({ sent: false, error: err.message })
  }
}
