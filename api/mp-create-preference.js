import { PRECIOS } from './_lib/precios.js'

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

  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' })
  const { id: userId } = await userRes.json()

  const { tipo, auto_id, concesionaria_id, profesional_id, user_id, user_email, origen } = req.body

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

  const APP_URL = process.env.APP_URL || 'https://fioramarket.store'
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
