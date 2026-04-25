export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { nombre, email, tipo } = req.body || {}
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY || !email) return res.status(200).json({ sent: false })

  const esConcesionaria = tipo === 'concesionaria'

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: email,
        subject: esConcesionaria
          ? `Bienvenido a FIORA MARKET, ${nombre}`
          : `Bienvenido a FIORA MARKET`,
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
    res.json({ sent: true })
  } catch (err) {
    res.status(200).json({ sent: false, error: err.message })
  }
}
