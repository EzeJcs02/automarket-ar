function sanitize(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 300)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { nombre, email, telefono, ciudad } = req.body || {}
  if (!nombre || !email) return res.status(400).json({ error: 'Faltan datos' })

  const sNombre = sanitize(nombre)
  const sEmail = sanitize(email)
  const sTelefono = sanitize(telefono || '—')
  const sCiudad = sanitize(ciudad || '—')

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rlautomotores24@gmail.com'

  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Missing RESEND_API_KEY' })

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: ADMIN_EMAIL,
        subject: `Nueva concesionaria registrada: ${sNombre}`,
        html: `
          <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:32px;border-radius:8px;max-width:500px">
            <div style="font-size:20px;font-weight:900;color:#e63329;margin-bottom:8px">Nueva concesionaria registrada</div>
            <p style="color:#888;margin-bottom:24px">Ya puede publicar en la plataforma. Este es un aviso informativo.</p>
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
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
