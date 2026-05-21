import { verifyUnsubscribeToken } from './_lib/unsubscribe-token.js'

export default async function handler(req, res) {
  const { id, t } = req.query || {}
  if (!id || !t) return res.status(400).send('Faltan parámetros')

  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    console.error('[unsubscribe-alerta] UNSUBSCRIBE_SECRET no configurada')
    return res.status(500).send('Servidor mal configurado')
  }

  if (!verifyUnsubscribeToken(id, t, secret)) {
    return res.status(403).send('Token inválido')
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/alertas_busqueda?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ activo: false }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (err) {
    console.error('[unsubscribe-alerta] DB error:', err.message)
    return res.status(500).send('No se pudo procesar la baja. Intentá más tarde.')
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(`
    <html><body style="font-family:sans-serif;background:#0a0a0a;color:#f5f3ee;padding:3rem;text-align:center">
      <h1 style="color:#e63329">FIORA MARKET</h1>
      <p>Tu alerta fue dada de baja correctamente. No vas a recibir más emails de esta búsqueda.</p>
      <p><a href="https://fioramarket.store" style="color:#e63329">Volver al inicio</a></p>
    </body></html>
  `)
}
