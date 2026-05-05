import { createClient } from '@supabase/supabase-js'

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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Verificar token con el mismo patrón que admin-users.js (probado que funciona)
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })

  if (!userRes.ok) {
    const body = await userRes.text().catch(() => '(no body)')
    console.error('Auth error: status', userRes.status, '| url:', supabaseUrl, '| body:', body, '| token starts with:', token?.slice(0, 20))
    return res.status(401).json({ error: 'Invalid token', status: userRes.status, detail: body })
  }

  const userData = await userRes.json()
  const email = userData.email
  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden', email, expected: ADMIN_EMAIL })
  }

  // Cliente con service role key para bypasear RLS en todas las operaciones
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { action, ...params } = req.body

  try {
    switch (action) {

      case 'aprobar':
        await supabase.from('concesionarias').update({ aprobada: true }).eq('id', params.id)
        break

      case 'rechazar':
        await supabase.from('concesionarias').delete().eq('id', params.id)
        break

      case 'suspender':
        await supabase.from('concesionarias').update({ aprobada: false }).eq('id', params.id)
        break

      case 'toggleDestacada':
        await supabase.from('concesionarias').update({ destacada: params.value }).eq('id', params.id)
        break

      case 'toggleBanner':
        await supabase.from('concesionarias').update({ banner_activo: params.value }).eq('id', params.id)
        break

      case 'cambiarPlan':
        await supabase.from('concesionarias').update({ plan: params.plan }).eq('id', params.id)
        await supabase.from('pagos').insert({
          concesionaria_id: params.id,
          tipo: `plan_${params.plan}`,
          estado: 'approved',
          monto: 0,
          mp_payment_id: `admin_manual_${Date.now()}`,
        })
        break

      case 'toggleFijado':
        await supabase.from('autos').update({ fijado_home: params.value }).eq('id', params.id)
        break

      case 'toggleDestacadoAuto':
        await supabase.from('autos').update({ destacado: params.value, urgente: false }).eq('id', params.id)
        break

      case 'toggleUrgenteAuto':
        await supabase.from('autos').update({ urgente: params.value, destacado: false }).eq('id', params.id)
        break

      case 'agregarAd':
        await supabase.from('publicidades').insert({
          nombre: params.nombre,
          imagen_url: params.imagen_url,
          link_url: params.link_url || null,
          fondo: params.fondo || 'oscuro',
          activo: true,
        })
        break

      case 'toggleAd':
        await supabase.from('publicidades').update({ activo: params.value }).eq('id', params.id)
        break

      case 'eliminarAd':
        await supabase.from('publicidades').delete().eq('id', params.id)
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
