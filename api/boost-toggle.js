// Activa/desactiva destacado o urgente en un auto propio, DENTRO del cupo
// gratuito que incluye el plan de la concesionaria (basico/pro/premium).
// Existe porque, tras el lockdown de RLS (docs/migration_lockdown_columnas_privilegiadas_2026_09.sql),
// el cliente ya no puede escribir estas columnas directo con la anon key — este
// endpoint reemplaza esa escritura re-validando ownership y límite de plan server-side.
// El boost individual pago (fuera de plan) sigue yendo por /api/mp-create-preference.
import { rateLimit } from './_lib/ratelimit.js'

const ALLOWED_ORIGIN = 'https://fioramarket.store'
const LIMITES_POR_PLAN = { basico: 1, pro: 3, premium: 10 }
const CAMPOS_VALIDOS = ['destacado', 'urgente']

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'
  const allowed = await rateLimit('boost-toggle', ip, { limit: 20, windowSec: 60 })
  if (!allowed) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en un minuto.' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')

  const { auto_id, campo, activar } = req.body || {}
  if (!auto_id || !CAMPOS_VALIDOS.includes(campo) || typeof activar !== 'boolean') {
    return res.status(400).json({ error: 'Parámetros inválidos' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' })
    const { id: userId } = await userRes.json()

    const sbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

    // Trae el auto + su concesionaria (ownership real y plan) en un solo round-trip.
    const autoRes = await fetch(
      `${supabaseUrl}/rest/v1/autos?id=eq.${encodeURIComponent(auto_id)}` +
      `&select=id,destacado,urgente,destacado_expira_at,urgente_expira_at,concesionaria_id,concesionarias(id,user_id,plan)`,
      { headers: sbHeaders }
    )
    if (!autoRes.ok) throw new Error(`Supabase GET /autos ${autoRes.status}`)
    const [auto] = await autoRes.json().catch(() => [])
    if (!auto) return res.status(404).json({ error: 'Publicación no encontrada' })

    const conc = auto.concesionarias
    // Este endpoint sólo cubre el cupo gratuito de plan (siempre concesionaria).
    // Particulares siguen pagando el boost individual vía mp-create-preference.
    if (!conc || conc.user_id !== userId) {
      return res.status(403).json({ error: 'No tenés permiso sobre esta publicación' })
    }

    // Los boosts pagos tienen *_expira_at; los del plan no. Un boost pago vigente
    // no se pisa desde acá (antes activar urgente apagaba un destacado ya cobrado).
    const otro = campo === 'destacado' ? 'urgente' : 'destacado'
    if (activar && auto[otro] && auto[`${otro}_expira_at`]) {
      return res.status(409).json({
        error: `Esta publicación tiene un ${otro} pago vigente hasta el ${new Date(auto[`${otro}_expira_at`]).toLocaleDateString('es-AR')}. Podés cambiarlo cuando venza.`,
      })
    }
    if (!activar && auto[`${campo}_expira_at`]) {
      return res.status(409).json({ error: `Este ${campo} es pago y vence solo el ${new Date(auto[`${campo}_expira_at`]).toLocaleDateString('es-AR')}.` })
    }

    if (activar) {
      const limite = LIMITES_POR_PLAN[conc.plan] ?? 0
      if (limite === 0) {
        return res.status(402).json({ error: 'Tu plan no incluye boosts incluidos. Comprá un boost individual.' })
      }

      // Cuenta los activos actuales del mismo campo para esta concesionaria —
      // server-side, no confiar en el contador que mande el cliente.
      const countRes = await fetch(
        `${supabaseUrl}/rest/v1/autos?concesionaria_id=eq.${encodeURIComponent(conc.id)}&${campo}=eq.true&${campo}_expira_at=is.null&select=id`,
        { headers: sbHeaders }
      )
      if (!countRes.ok) throw new Error(`Supabase GET count ${countRes.status}`)
      const activos = await countRes.json().catch(() => [])
      if (activos.length >= limite) {
        return res.status(402).json({
          error: `Tu plan permite hasta ${limite} ${campo === 'destacado' ? 'destacados' : 'urgentes'} simultáneos. Ya tenés ${activos.length} activos.`,
        })
      }
    }

    // destacado y urgente son mutuamente excluyentes (igual que hace el webhook de pago).
    const patch = campo === 'destacado'
      ? { destacado: activar, urgente: activar ? false : auto.urgente }
      : { urgente: activar, destacado: activar ? false : auto.destacado }

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/autos?id=eq.${encodeURIComponent(auto_id)}`, {
      method: 'PATCH',
      headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    })
    if (!patchRes.ok) {
      const text = await patchRes.text()
      throw new Error(`Supabase PATCH /autos ${patchRes.status} - ${text}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('boost-toggle error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
