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

  const [r1, r2] = await Promise.all([
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
  ])

  res.status(200).json({ ok: true, destacado: r1.status, urgente: r2.status })
}
