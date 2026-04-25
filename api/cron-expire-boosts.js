export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  const now = new Date().toISOString()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [r1, r2, r3] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/autos?destacado=eq.true&destacado_expira_at=lt.${now}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ destacado: false, destacado_expira_at: null }),
    }),
    fetch(`${supabaseUrl}/rest/v1/autos?urgente=eq.true&urgente_expira_at=lt.${now}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ urgente: false, urgente_expira_at: null }),
    }),
    // Expirar autos de particulares (concesionaria_id IS NULL) con más de 30 días sin renovar
    fetch(`${supabaseUrl}/rest/v1/autos?activo=eq.true&concesionaria_id=is.null&created_at=lt.${thirtyDaysAgo}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ activo: false }),
    }),
  ])

  res.status(200).json({ ok: true, destacado: r1.status, urgente: r2.status, autos_expired: r3.status })
}
