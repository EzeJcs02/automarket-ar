import { createClient } from '@supabase/supabase-js'

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
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  if (!ADMIN_EMAIL) {
    console.error('FATAL: ADMIN_EMAIL env var not set')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })

  if (!userRes.ok) {
    const body = await userRes.text().catch(() => '(no body)')
    console.error('Auth error: status', userRes.status, '| body:', body)
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { email } = await userRes.json()
  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { action, ...params } = req.body

  try {
    switch (action) {

      case 'aprobar':
        await supabase.from('concesionarias').update({ aprobada: true }).eq('id', params.id)
        await supabase.from('autos').update({ activo: true }).eq('concesionaria_id', params.id)
        break

      case 'rechazar':
        await supabase.from('autos').delete().eq('concesionaria_id', params.id)
        await supabase.from('concesionarias').delete().eq('id', params.id)
        break

      case 'suspender':
        await supabase.from('autos').update({ activo: false }).eq('concesionaria_id', params.id)
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

      case 'agregarAd': {
        const imgUrl = params.imagen_url?.trim() || ''
        if (!imgUrl.startsWith('https://')) {
          return res.status(400).json({ error: 'imagen_url debe usar HTTPS' })
        }
        await supabase.from('publicidades').insert({
          nombre: params.nombre,
          imagen_url: imgUrl,
          link_url: params.link_url || null,
          fondo: params.fondo || 'oscuro',
          activo: true,
        })
        break
      }

      case 'toggleAd':
        await supabase.from('publicidades').update({ activo: params.value }).eq('id', params.id)
        break

      case 'eliminarAd':
        await supabase.from('publicidades').delete().eq('id', params.id)
        break

      // Operaciones de profesionales
      case 'aprobarProfesional':
        await supabase.from('profesionales').update({ aprobado: true, activo: true }).eq('id', params.id)
        break

      case 'eliminarUsuario':
        await supabase.from('autos').delete().eq('user_id', params.id)
        await supabase.from('concesionarias').delete().eq('user_id', params.id)
        await supabase.from('profesionales').delete().eq('user_id', params.id)
        await supabase.auth.admin.deleteUser(params.id)
        break

      case 'rechazarProfesional':
        await supabase.from('profesionales').delete().eq('id', params.id)
        break

      case 'suspenderProfesional':
        await supabase.from('profesionales').update({ aprobado: false, activo: false }).eq('id', params.id)
        break

      case 'toggleVerificadoProfesional':
        await supabase.from('profesionales').update({ verificado: params.value }).eq('id', params.id)
        break

      case 'toggleDestacadoProfesional':
        await supabase.from('profesionales').update({ destacado: params.value }).eq('id', params.id)
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
