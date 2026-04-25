export default async function handler(req, res) {
  res.status(200).json({ received: true })

  const topic = req.query.topic || req.body?.type
  const id = req.query.id || req.body?.data?.id

  if (!id) return
  if (topic !== 'payment' && topic !== 'payment.updated') return

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    const payment = await mpRes.json()

    if (payment.status !== 'approved') return

    const { tipo, auto_id, concesionaria_id, user_id, user_email } = payment.metadata || {}

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }

    const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (tipo === 'destacado' && auto_id) {
      await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ destacado: true, urgente: false, destacado_expira_at: in30days }),
      })
    } else if (tipo === 'urgente' && auto_id) {
      await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ urgente: true, destacado: false, urgente_expira_at: in30days }),
      })
    } else if (tipo === 'fijado_home' && auto_id) {
      await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fijado_home: true }),
      })
    } else if (tipo === 'banner_home' && concesionaria_id) {
      await fetch(`${supabaseUrl}/rest/v1/concesionarias?id=eq.${concesionaria_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ banner_activo: true }),
      })
    } else if (['plan_basico', 'plan_pro', 'plan_premium'].includes(tipo) && concesionaria_id) {
      const plan = tipo.replace('plan_', '')
      await fetch(`${supabaseUrl}/rest/v1/concesionarias?id=eq.${concesionaria_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ plan }),
      })
    }

    await fetch(`${supabaseUrl}/rest/v1/pagos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mp_payment_id: String(id),
        tipo,
        auto_id: auto_id || null,
        concesionaria_id: concesionaria_id || null,
        user_id: user_id || null,
        monto: payment.transaction_amount,
        estado: payment.status,
      }),
    })

    if (user_email && process.env.RESEND_API_KEY) {
      const LABELS = {
        destacado: 'Boost Destacado (30 días)',
        urgente: 'Boost Urgente (30 días)',
        fijado_home: 'Vehículo Fijado en Home',
        banner_home: 'Banner Publicitario en Home',
        plan_basico: 'Plan Básico',
        plan_pro: 'Plan Pro',
        plan_premium: 'Plan Premium',
        subir_tope: 'Subir al tope',
        destacado_individual: 'Destacado Individual',
        urgente_individual: 'Urgente Individual',
        renovar: 'Renovar publicación 30 días',
      }
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FIORA.MARKET <noreply@fioramarket.store>',
          to: [user_email],
          subject: '✅ Pago confirmado – FIORA.MARKET',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#e63329;padding:24px 32px">
                <div style="font-size:22px;font-weight:900;letter-spacing:.05em">FIORA.MARKET</div>
              </div>
              <div style="padding:32px">
                <div style="font-size:20px;font-weight:700;margin-bottom:8px">¡Pago recibido!</div>
                <p style="color:#aaa;font-size:14px;margin:0 0 24px">Tu pago fue procesado correctamente.</p>
                <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:24px">
                  <div style="font-size:12px;color:#777;margin-bottom:4px;text-transform:uppercase;letter-spacing:.1em">Servicio</div>
                  <div style="font-size:16px;font-weight:700">${LABELS[tipo] || tipo}</div>
                  <div style="font-size:12px;color:#777;margin-top:12px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.1em">Monto</div>
                  <div style="font-size:16px;font-weight:700">$${Number(payment.transaction_amount).toLocaleString('es-AR')} ARS</div>
                  <div style="font-size:12px;color:#777;margin-top:12px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.1em">ID de pago</div>
                  <div style="font-size:13px;color:#aaa;font-family:monospace">${id}</div>
                </div>
                <p style="color:#aaa;font-size:13px">El servicio ya fue activado en tu cuenta. Ante cualquier consulta respondé este email.</p>
              </div>
            </div>
          `,
        }),
      })
    }
  } catch (err) {
    console.error('mp-webhook error:', err)
  }
}
