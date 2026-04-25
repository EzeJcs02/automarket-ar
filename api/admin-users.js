export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=500`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  if (!usersRes.ok) return res.status(500).json({ error: 'Failed to fetch users' })

  const data = await usersRes.json()
  const users = (data.users || []).map(u => ({
    id: u.id,
    email: u.email,
    nombre: u.user_metadata?.nombre || null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }))

  res.status(200).json({ users })
}
