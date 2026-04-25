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

    const { tipo, auto_id, concesionaria_id, user_id } = payment.metadata || {}

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }

    if (tipo === 'destacado' && auto_id) {
      await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ destacado: true, urgente: false }),
      })
    } else if (tipo === 'urgente' && auto_id) {
      await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${auto_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ urgente: true, destacado: false }),
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
  } catch (err) {
    console.error('mp-webhook error:', err)
  }
}
