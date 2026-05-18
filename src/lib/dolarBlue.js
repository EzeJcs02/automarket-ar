const CACHE_KEY = 'fiora_dolar_blue'
const TTL_MS = 30 * 60 * 1000 // 30 minutos

export async function getDolarBlue() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { venta, ts } = JSON.parse(cached)
      if (Date.now() - ts < TTL_MS) return venta
    }

    let venta = null

    try {
      const r = await fetch('https://dolarapi.com/v1/dolares/blue', { signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        const d = await r.json()
        venta = Number(d?.venta)
      }
    } catch {
      // primera API falló, sigue con fallback
    }

    if (!venta || !isFinite(venta) || venta <= 0) {
      try {
        const r2 = await fetch('https://api.bluelytics.com.ar/v2/latest', { signal: AbortSignal.timeout(4000) })
        if (r2.ok) {
          const d2 = await r2.json()
          venta = Number(d2?.blue?.value_sell)
        }
      } catch {
        // segunda API falló también
      }
    }

    if (venta && isFinite(venta) && venta > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ venta, ts: Date.now() }))
      return venta
    }

    // Stale cache recovery
    if (cached) return JSON.parse(cached).venta

    return null
  } catch {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached).venta
    } catch { /* nada */ }
    return null
  }
}
