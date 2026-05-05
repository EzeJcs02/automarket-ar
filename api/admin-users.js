const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fioramarket99@gmail.com'
const ALLOWED_ORIGIN = 'https://fioramarket.store'

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === ALLOWED_ORIGIN) res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  // Verificar que el token pertenece al usuario admin
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
  })

  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' })

  const { email } = await userRes.json()
  if (email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })

  const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=500`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
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
