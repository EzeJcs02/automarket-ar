// NOTA: Para que la expiración respete renovaciones, agregar columna `renovado_at` en Supabase:
// ALTER TABLE autos ADD COLUMN IF NOT EXISTS renovado_at TIMESTAMPTZ DEFAULT now();
// UPDATE autos SET renovado_at = created_at WHERE renovado_at IS NULL;
// CREATE INDEX IF NOT EXISTS idx_autos_renovado ON autos(renovado_at) WHERE activo = true AND concesionaria_id IS NULL;
//
// Actualizar `renovado_at = now()` cada vez que el usuario renueva su publicación.

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  const now = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let r1, r2, r3
  try {
    ;[r1, r2, r3] = await Promise.all([
      // Expirar boosts destacado vencidos
      fetch(`${supabaseUrl}/rest/v1/autos?destacado=eq.true&destacado_expira_at=lt.${now}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ destacado: false, destacado_expira_at: null }),
        signal: AbortSignal.timeout(10_000),
      }),
      // Expirar boosts urgente vencidos
      fetch(`${supabaseUrl}/rest/v1/autos?urgente=eq.true&urgente_expira_at=lt.${now}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ urgente: false, urgente_expira_at: null }),
        signal: AbortSignal.timeout(10_000),
      }),
      // Expirar autos de particulares sin renovación en 30 días
      // Usa `renovado_at` para respetar renovaciones (fallback a created_at si la columna no existe aún)
      fetch(
        `${supabaseUrl}/rest/v1/autos?activo=eq.true&concesionaria_id=is.null&or=(renovado_at.lt.${thirtyDaysAgo},and(renovado_at.is.null,created_at.lt.${thirtyDaysAgo}))`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ activo: false }),
          signal: AbortSignal.timeout(10_000),
        }
      ),
    ])
  } catch (err) {
    console.error('[cron-expire-boosts] Supabase request failed:', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }

  // Verificar errores HTTP en cada operación
  const results = {
    destacado: r1.status,
    urgente: r2.status,
    autos_expired: r3.status,
  }

  const failedOps = Object.entries(results).filter(([, status]) => status >= 400)
  if (failedOps.length > 0) {
    console.error('[cron-expire-boosts] Operaciones fallidas:', failedOps)
    return res.status(207).json({
      ok: false,
      error: 'Una o más operaciones fallaron',
      results,
    })
  }

  res.status(200).json({ ok: true, ...results })
}
