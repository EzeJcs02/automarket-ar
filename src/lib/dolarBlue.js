// Módulo de caché stale-while-revalidate para el tipo de cambio dólar blue
// TTL: 10 minutos en sessionStorage → evita N fetches por sesión y rate-limiting de la API pública

const CACHE_KEY = 'fiora_dolar_blue'
const TTL_MS = 10 * 60 * 1000 // 10 minutos

export async function getDolarBlue() {
  try {
    // 1. Intentar hit de caché
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { venta, ts } = JSON.parse(cached)
      if (Date.now() - ts < TTL_MS) return venta
    }

    let venta = null;
    
    // 2. Main API (DolarApi) con timeout estricto de 3 segundos
    try {
      const r = await fetch('https://dolarapi.com/v1/dolares/blue', { signal: AbortSignal.timeout(3000) })
      if (r.ok) {
        const d = await r.json()
        venta = Number(d?.venta)
      }
    } catch (e) {
      console.warn('Fallback 1: API DolarApi falló, intentando secundaria');
    }

    // 3. Fallback API (Bluelytics)
    if (!venta || !isFinite(venta) || venta <= 0) {
      const r2 = await fetch('https://api.bluelytics.com.ar/v2/latest', { signal: AbortSignal.timeout(3000) })
      if (r2.ok) {
        const d2 = await r2.json()
        venta = Number(d2?.blue?.value_sell)
      }
    }

    // Validar resultado final
    if (!venta || !isFinite(venta) || venta <= 0) {
        throw new Error('Ambas APIs de cotización fallaron')
    }

    // Guardar en caché con timestamp
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ venta, ts: Date.now() }))
    return venta
    
  } catch (err) {
    console.error('Error crítico Dólar Blue:', err)
    // 4. Stale Cache Recovery (Servir datos vencidos para no romper UI)
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached).venta
    return null
  }
}
