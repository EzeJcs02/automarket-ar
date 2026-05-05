const BASE_URL = 'https://fioramarket.store'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/catalogo', priority: '0.9', changefreq: 'hourly' },
  { loc: '/concesionarias', priority: '0.8', changefreq: 'daily' },
  { loc: '/planes', priority: '0.7', changefreq: 'weekly' },
  { loc: '/publicitate', priority: '0.6', changefreq: 'monthly' },
  { loc: '/login', priority: '0.3', changefreq: 'yearly' },
  { loc: '/registro', priority: '0.3', changefreq: 'yearly' },
  { loc: '/legales', priority: '0.2', changefreq: 'yearly' },
]

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let autos = []
  let concesionarias = []

  try {
    const [autosRes, concRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/autos?activo=eq.true&select=id,updated_at&order=updated_at.desc&limit=1000`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      }),
      fetch(`${supabaseUrl}/rest/v1/concesionarias?aprobada=eq.true&select=id,updated_at`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      }),
    ])
    autos = await autosRes.json()
    concesionarias = await concRes.json()
  } catch {}

  const urls = [
    ...STATIC_URLS.map(u => `
  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
    ...(Array.isArray(autos) ? autos : []).map(a => `
  <url>
    <loc>${BASE_URL}/auto/${a.id}</loc>
    <lastmod>${a.updated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...(Array.isArray(concesionarias) ? concesionarias : []).map(c => `
  <url>
    <loc>${BASE_URL}/concesionaria/${c.id}</loc>
    <lastmod>${c.updated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(xml)
}
