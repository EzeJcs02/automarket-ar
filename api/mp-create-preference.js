const ALLOWED_ORIGIN = 'https://fioramarket.store'

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verificar identidad del solicitante
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' })
  const { id: userId } = await userRes.json()

  const { tipo, auto_id, concesionaria_id, profesional_id, user_id, user_email, origen } = req.body

  const PRECIOS = {
    destacado:            { monto: 15000,  titulo: 'Boost Destacado – FIORA MARKET' },
    urgente:              { monto: 20000,  titulo: 'Boost Urgente – FIORA MARKET' },
    fijado_home:          { monto: 50000,  titulo: 'Vehículo Fijado en Home – FIORA MARKET' },
    banner_home:          { monto: 80000,  titulo: 'Banner Publicitario en Home – FIORA MARKET' },
    plan_basico:          { monto: 30000,  titulo: 'Plan Básico – FIORA MARKET' },
    plan_pro:             { monto: 70000,  titulo: 'Plan Pro – FIORA MARKET' },
    plan_premium:         { monto: 150000, titulo: 'Plan Premium – FIORA MARKET' },
    publicacion_adicional:{ monto: 15000,  titulo: 'Publicación Adicional – FIORA MARKET' },
    subir_tope:           { monto: 10000,  titulo: 'Subir al tope – FIORA MARKET' },
    destacado_individual: { monto: 15000,  titulo: 'Destacado Individual – FIORA MARKET' },
    urgente_individual:   { monto: 20000,  titulo: 'Urgente Individual – FIORA MARKET' },
    renovar:              { monto: 10000,  titulo: 'Renovar publicación – FIORA MARKET' },
    publicidad_lateral:         { monto: 15000,  titulo: 'Espacio Publicitario Lateral – FIORA MARKET' },
    plan_profesional_base:      { monto: 10000,  titulo: 'Plan Profesional Base – FIORA MARKET' },
    plan_profesional_destacado: { monto: 30000,  titulo: 'Plan Profesional Destacado – FIORA MARKET' },
  }

  const precio = PRECIOS[tipo]
  if (!precio) return res.status(400).json({ error: 'Tipo de pago inválido' })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  }

  // Validar ownership: si se provee concesionaria_id, debe pertenecer al usuario autenticado
  if (concesionaria_id) {
    const concRes = await fetch(
      `${supabaseUrl}/rest/v1/concesionarias?id=eq.${encodeURIComponent(concesionaria_id)}&select=user_id`,
      { headers: sbHeaders }
    )
    const [conc] = await concRes.json().catch(() => [])
    if (!conc || conc.user_id !== userId) {
      return res.status(403).json({ error: 'No tenés permiso para usar este recurso' })
    }
  }

  // Validar ownership: si se provee profesional_id, debe pertenecer al usuario autenticado
  if (profesional_id) {
    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/profesionales?id=eq.${encodeURIComponent(profesional_id)}&select=user_id`,
      { headers: sbHeaders }
    )
    const [prof] = await profRes.json().catch(() => [])
    if (!prof || prof.user_id !== userId) {
      return res.status(403).json({ error: 'No tenés permiso para usar este recurso' })
    }
  }

  // Validar ownership: si se provee user_id, debe coincidir con el usuario autenticado
  if (user_id && user_id !== userId) {
    return res.status(403).json({ error: 'No tenés permiso para usar este recurso' })
  }

  const APP_URL = process.env.APP_URL || 'https://automarket-ar.vercel.app'
  const back_url = origen === 'mi-cuenta' ? `${APP_URL}/mi-cuenta`
    : origen === 'panel-profesional' ? `${APP_URL}/panel-profesional`
    : `${APP_URL}/panel`

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
      profesional_id: profesional_id || null,
      user_id: userId, // usar siempre el userId verificado, no el del body
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
