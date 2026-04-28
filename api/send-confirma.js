export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, nombre, auto, concesionaria } = req.body
  if (!email || !nombre || !auto) return res.status(400).json({ error: 'Faltan datos' })

  if (!process.env.RESEND_API_KEY) return res.status(200).json({ sent: false, reason: 'no-resend-key' })

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
    res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-confirma error:', err)
    res.status(200).json({ sent: false, error: err.message })
  }
}
