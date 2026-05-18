const CACHE_KEY = 'fiora_dolar_blue'
const TTL_MS = 30 * 60 * 1000

async function tryFetch(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (r.ok) return await r.json()
  } catch { /* ignorar */ }
  return null
}

export async function getDolarBlue() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const cached = raw ? JSON.parse(raw) : null
    if (cached && Date.now() - cached.ts < TTL_MS) return cached.venta

    let venta = null

    // API 1: dolarapi.com
    const d1 = await tryFetch('https://dolarapi.com/v1/dolares/blue')
    if (d1?.venta > 0) venta = Number(d1.venta)

    // API 2: bluelytics
    if (!venta) {
      const d2 = await tryFetch('https://api.bluelytics.com.ar/v2/latest')
      if (d2?.blue?.value_sell > 0) venta = Number(d2.blue.value_sell)
    }

    // API 3: argentinadatos
    if (!venta) {
      const d3 = await tryFetch('https://api.argentinadatos.com/v1/cotizaciones/dolares/blue')
      if (d3?.venta > 0) venta = Number(d3.venta)
    }

    if (venta && isFinite(venta)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ venta, ts: Date.now() }))
      return venta
    }

    // Stale cache (cualquier valor guardado, aunque vencido)
    if (cached?.venta) return cached.venta

    // Fallback estático — se actualiza en cuanto una API responda
    return 1300
  } catch {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) return JSON.parse(raw).venta
    } catch { /* nada */ }
    return 1300
  }
}
