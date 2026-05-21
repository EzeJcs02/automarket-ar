// Endpoint unificado de notificaciones de registro.
// Reemplaza a /api/notify-admin y /api/welcome-email para respetar el límite
// de 12 funciones del plan Hobby de Vercel.
//
// body.action:
//   'admin'   → notifica al admin que se registró una nueva concesionaria/profesional
//   'welcome' → email de bienvenida al usuario recién registrado

const ALLOWED_ORIGIN = 'https://fioramarket.store'

const rateLimit = new Map()
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 5

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
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 300)
}

async function notifyAdmin(req, res) {
  const { nombre, email, telefono, ciudad, tipo } = req.body || {}
  if (!nombre || !email) return res.status(400).json({ error: 'Faltan datos' })

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!ADMIN_EMAIL) return res.status(500).json({ error: 'Server misconfiguration' })
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Missing RESEND_API_KEY' })

  const sNombre = sanitize(nombre)
  const sEmail = sanitize(email)
  const sTelefono = sanitize(telefono || '—')
  const sCiudad = sanitize(ciudad || '—')
  const subjectPrefix = tipo === 'profesional' ? 'Nuevo profesional registrado' : 'Nueva concesionaria registrada'

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: ADMIN_EMAIL,
        subject: `${subjectPrefix}: ${sNombre}`,
        html: `
          <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:32px;border-radius:8px;max-width:500px">
            <div style="font-size:20px;font-weight:900;color:#e63329;margin-bottom:8px">${subjectPrefix}</div>
            <p style="color:#888;margin-bottom:24px">Revisar y aprobar desde el panel.</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Nombre</td><td style="padding:8px 0;font-weight:bold">${sNombre}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Email</td><td style="padding:8px 0;color:#e63329">${sEmail}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Teléfono</td><td style="padding:8px 0">${sTelefono}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em">Ciudad</td><td style="padding:8px 0">${sCiudad}</td></tr>
            </table>
            <a href="https://fioramarket.store/admin" style="display:inline-block;margin-top:24px;background:#e63329;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ir al panel admin →</a>
          </div>
        `,
      }),
    })
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function sendWelcome(req, res) {
  const { nombre, email, tipo, user_id } = req.body || {}
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY || !email || !user_id) return res.status(200).json({ sent: false })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
        headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
      })
      if (!r.ok) return res.status(200).json({ sent: false, reason: 'invalid-user' })
      const u = await r.json()
      if (u.email !== email) return res.status(200).json({ sent: false, reason: 'email-mismatch' })
    } catch {
      return res.status(200).json({ sent: false, reason: 'verify-error' })
    }
  }

  const esConcesionaria = tipo === 'concesionaria'

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: email,
        subject: esConcesionaria ? `Bienvenido a FIORA MARKET, ${nombre}` : 'Bienvenido a FIORA MARKET',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
            <div style="background:#e63329;padding:24px 32px">
              <div style="font-size:22px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
            </div>
            <div style="padding:32px">
              <div style="font-size:24px;font-weight:700;margin-bottom:8px">
                ${esConcesionaria ? `¡Bienvenido, ${nombre}!` : '¡Bienvenido a FIORA MARKET!'}
              </div>
              <p style="color:#888;font-size:14px;line-height:1.7;margin-bottom:24px">
                ${esConcesionaria
                  ? `Tu concesionaria ya está activa en la plataforma. Podés empezar a publicar vehículos y recibir consultas de compradores de todo el país.`
                  : `Tu cuenta fue creada exitosamente. Ya podés explorar miles de vehículos, guardar tus favoritos y contactar concesionarias directamente.`
                }
              </p>
              ${esConcesionaria ? `
              <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:24px">
                <div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">Primeros pasos</div>
                <div style="display:flex;flex-direction:column;gap:10px">
                  <div style="font-size:14px">✓ &nbsp;Completá tu perfil de agencia (logo, descripción, WhatsApp)</div>
                  <div style="font-size:14px">✓ &nbsp;Publicá tu primer vehículo</div>
                  <div style="font-size:14px">✓ &nbsp;Activá tu plan para más publicaciones</div>
                </div>
              </div>
              <a href="https://fioramarket.store/panel" style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Ir al panel →</a>
              ` : `
              <a href="https://fioramarket.store/catalogo" style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Ver catálogo →</a>
              `}
            </div>
            <div style="padding:16px 32px;border-top:1px solid #1a1a1a;font-size:11px;color:#555">
              FIORA MARKET — La plataforma de vehículos más avanzada de Argentina
            </div>
          </div>
        `,
      }),
    })
    return res.json({ sent: true })
  } catch (err) {
    return res.status(200).json({ sent: false, error: err.message })
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin && origin !== ALLOWED_ORIGIN) return res.status(403).json({ error: 'Forbidden' })
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes' })

  const action = req.body?.action
  if (action === 'admin') return notifyAdmin(req, res)
  if (action === 'welcome') return sendWelcome(req, res)
  return res.status(400).json({ error: 'action inválido (debe ser "admin" o "welcome")' })
}
