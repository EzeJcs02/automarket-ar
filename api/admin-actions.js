const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fioramarket99@gmail.com'
const ALLOWED_ORIGIN = 'https://fioramarket.store'

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Verificar que el token pertenece al admin
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' })
  const { email } = await userRes.json()
  if (email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })

  const sbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
  const { action, ...params } = req.body

  try {
    switch (action) {

      case 'aprobar':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'PATCH', sbHeaders, { aprobada: true })
        break

      case 'rechazar':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'DELETE', sbHeaders)
        break

      case 'suspender':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'PATCH', sbHeaders, { aprobada: false })
        break

      case 'toggleDestacada':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'PATCH', sbHeaders, { destacada: params.value })
        break

      case 'toggleBanner':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'PATCH', sbHeaders, { banner_activo: params.value })
        break

      case 'cambiarPlan':
        await sbFetch(supabaseUrl, `/rest/v1/concesionarias?id=eq.${params.id}`, 'PATCH', sbHeaders, { plan: params.plan })
        await sbFetch(supabaseUrl, `/rest/v1/pagos`, 'POST', { ...sbHeaders, Prefer: 'return=minimal' }, {
          concesionaria_id: params.id,
          tipo: `plan_${params.plan}`,
          estado: 'approved',
          monto: 0,
          mp_payment_id: `admin_manual_${Date.now()}`,
        })
        break

      case 'toggleFijado':
        await sbFetch(supabaseUrl, `/rest/v1/autos?id=eq.${params.id}`, 'PATCH', sbHeaders, { fijado_home: params.value })
        break

      case 'toggleDestacadoAuto':
        await sbFetch(supabaseUrl, `/rest/v1/autos?id=eq.${params.id}`, 'PATCH', sbHeaders, { destacado: params.value, urgente: false })
        break

      case 'toggleUrgenteAuto':
        await sbFetch(supabaseUrl, `/rest/v1/autos?id=eq.${params.id}`, 'PATCH', sbHeaders, { urgente: params.value, destacado: false })
        break

      case 'agregarAd':
        await sbFetch(supabaseUrl, `/rest/v1/publicidades`, 'POST', { ...sbHeaders, Prefer: 'return=minimal' }, {
          nombre: params.nombre,
          imagen_url: params.imagen_url,
          link_url: params.link_url || null,
          fondo: params.fondo || 'oscuro',
          activo: true,
        })
        break

      case 'toggleAd':
        await sbFetch(supabaseUrl, `/rest/v1/publicidades?id=eq.${params.id}`, 'PATCH', sbHeaders, { activo: params.value })
        break

      case 'eliminarAd':
        await sbFetch(supabaseUrl, `/rest/v1/publicidades?id=eq.${params.id}`, 'DELETE', sbHeaders)
        break

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('admin-actions error:', err)
    res.status(500).json({ error: err.message })
  }
}

async function sbFetch(url, path, method, headers, body) {
  const r = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Supabase error ${r.status}: ${text}`)
  }
}
