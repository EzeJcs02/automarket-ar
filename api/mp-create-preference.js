export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { tipo, auto_id, concesionaria_id, user_id, user_email, origen } = req.body

  const PRECIOS = {
    destacado:            { monto: 15000,  titulo: 'Boost Destacado – FIORA.MARKET' },
    urgente:              { monto: 20000,  titulo: 'Boost Urgente – FIORA.MARKET' },
    fijado_home:          { monto: 50000,  titulo: 'Vehículo Fijado en Home – FIORA.MARKET' },
    banner_home:          { monto: 80000,  titulo: 'Banner Publicitario en Home – FIORA.MARKET' },
    plan_basico:          { monto: 30000,  titulo: 'Plan Básico – FIORA.MARKET' },
    plan_pro:             { monto: 70000,  titulo: 'Plan Pro – FIORA.MARKET' },
    plan_premium:         { monto: 150000, titulo: 'Plan Premium – FIORA.MARKET' },
    publicacion_adicional:{ monto: 15000,  titulo: 'Publicación Adicional – FIORA.MARKET' },
    subir_tope:           { monto: 10000,  titulo: 'Subir al tope – FIORA.MARKET' },
    destacado_individual: { monto: 15000,  titulo: 'Destacado Individual – FIORA.MARKET' },
    urgente_individual:   { monto: 20000,  titulo: 'Urgente Individual – FIORA.MARKET' },
    renovar:              { monto: 10000,  titulo: 'Renovar publicación – FIORA.MARKET' },
  }

  const precio = PRECIOS[tipo]
  if (!precio) return res.status(400).json({ error: 'Tipo de pago inválido' })

  const APP_URL = process.env.APP_URL || 'https://automarket-ar.vercel.app'
  const back_url = origen === 'mi-cuenta' ? `${APP_URL}/mi-cuenta` : `${APP_URL}/panel`

  const body = {
    items: [{
      title: precio.titulo,
      quantity: 1,
      currency_id: 'ARS',
      unit_price: precio.monto,
    }],
    metadata: {
      tipo,
      auto_id: auto_id || null,
      concesionaria_id: concesionaria_id || null,
      user_id: user_id || null,
      user_email: user_email || null,
    },
    back_urls: {
      success: `${back_url}?mp=ok`,
      failure: `${back_url}?mp=fail`,
      pending: `${back_url}?mp=pending`,
    },
    auto_return: 'approved',
    notification_url: `${APP_URL}/api/mp-webhook`,
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('MP error:', data)
      return res.status(500).json({ error: 'Error al crear preferencia de pago' })
    }

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    })
  } catch (err) {
    console.error('mp-create-preference error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
