// Endpoint unificado de emails transaccionales relacionados a una consulta.
// Reemplaza a /api/send-consulta y /api/send-confirma para respetar el límite
// de 12 funciones del plan Hobby de Vercel.
//
// Se invoca con body.action: 'consulta' (notifica al vendedor) | 'confirma' (notifica al comprador).

import { rateLimit } from './_lib/ratelimit.js'

const ALLOWED_ORIGIN = 'https://fioramarket.store'

function sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 2000)
}

async function sendConsulta(req, res) {
  const { auto_id, nombre, email, mensaje, telefono } = req.body
  if (!auto_id || !nombre || !email || !mensaje) return res.status(400).json({ error: 'Faltan datos' })
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auto_id)) {
    return res.status(400).json({ error: 'ID de publicación inválido' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' })
  if (nombre.length > 200 || mensaje.length > 5000) return res.status(400).json({ error: 'Datos demasiado largos' })

  if (!process.env.RESEND_API_KEY) return res.status(200).json({ sent: false, reason: 'no-resend-key' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

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

    let sellerEmail
    if (auto.concesionaria_id && auto.concesionarias?.email) {
      sellerEmail = auto.concesionarias.email
    } else if (auto.user_id) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${auto.user_id}`, { headers: sbHeaders })
      if (userRes.ok) {
        const userData = await userRes.json()
        sellerEmail = userData.email
      } else {
        console.error(`send-email/consulta: failed to fetch user ${auto.user_id}: ${userRes.status}`)
      }
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

    return res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-email/consulta error:', err)
    return res.status(200).json({ sent: false, error: err.message })
  }
}

async function sendConfirma(req, res) {
  const { email, nombre, auto, concesionaria, auto_id } = req.body
  if (!email || !nombre || !auto || !auto_id) return res.status(400).json({ error: 'Faltan datos' })
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auto_id)) {
    return res.status(400).json({ error: 'ID de publicación inválido' })
  }

  if (!process.env.RESEND_API_KEY) return res.status(200).json({ sent: false, reason: 'no-resend-key' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}&select=id&limit=1`, {
        headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
      })
      const rows = await r.json()
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(200).json({ sent: false, reason: 'invalid-auto' })
      }
    } catch {
      return res.status(200).json({ sent: false, reason: 'verify-error' })
    }
  }

  const sNombre = String(nombre).slice(0, 200)
  const sAuto = String(auto).slice(0, 200)
  const sConcesionaria = String(concesionaria || 'el vendedor').slice(0, 200)

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: [email],
        subject: `Tu consulta fue enviada — ${sAuto}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
            <div style="background:#e63329;padding:24px 32px">
              <div style="font-size:22px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
            </div>
            <div style="padding:32px">
              <div style="font-size:18px;font-weight:700;margin-bottom:8px">¡Hola, ${sNombre}!</div>
              <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px">
                Tu consulta sobre el <strong style="color:#f5f3ee">${sAuto}</strong> fue enviada exitosamente a <strong style="color:#f5f3ee">${sConcesionaria}</strong>.
              </p>
              <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:24px;border-left:3px solid #e63329">
                <div style="font-size:13px;color:#888;">En breve el vendedor se contactará con vos para continuar con la operación.</div>
              </div>
              <a href="https://fioramarket.store/catalogo" style="display:inline-block;background:#e63329;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:.02em">
                Seguir explorando vehículos
              </a>
              <p style="color:#444;font-size:12px;margin-top:28px">
                Si no realizaste esta consulta, ignorá este mensaje.
              </p>
            </div>
          </div>
        `,
      }),
    })
    return res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-email/confirma error:', err)
    return res.status(200).json({ sent: false, error: err.message })
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  const allowed = await rateLimit('send-email', ip, { limit: 5, windowSec: 60 })
  if (!allowed) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en un minuto.' })

  const action = req.body?.action
  if (action === 'consulta') return sendConsulta(req, res)
  if (action === 'confirma') return sendConfirma(req, res)
  return res.status(400).json({ error: 'action inválido (debe ser "consulta" o "confirma")' })
}
