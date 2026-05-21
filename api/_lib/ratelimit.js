// Rate limit persistente con Upstash Redis.
// Si las env vars no están configuradas (ej. desarrollo local), usa fallback en memoria.
//
// Uso:
//   import { rateLimit } from './_lib/ratelimit.js'
//   const ok = await rateLimit('arrepentimiento', ip, { limit: 3, windowSec: 60 })
//   if (!ok) return res.status(429).json({ error: '...' })

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

let redis = null
const limiters = new Map() // cachear por (limit,window) para no recrear el limiter en cada call

if (hasUpstash) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Fallback en memoria — sólo se activa si Upstash no está configurado.
const memStore = new Map()

function memRateLimit(key, limit, windowSec) {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now - entry.start > windowSec * 1000) {
    memStore.set(key, { count: 1, start: now })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/**
 * @param {string} namespace — identifica el endpoint (ej. 'arrepentimiento', 'send-email')
 * @param {string} identifier — ip o user_id
 * @param {{limit:number, windowSec:number}} opts
 * @returns {Promise<boolean>} true si se permite la request, false si excedió
 */
export async function rateLimit(namespace, identifier, { limit, windowSec }) {
  const key = `${namespace}:${identifier}`

  if (!hasUpstash) {
    // Dev/staging sin Upstash → memoria (bypaseable, sólo para no romper)
    return memRateLimit(key, limit, windowSec)
  }

  try {
    const cacheKey = `${limit}:${windowSec}`
    let limiter = limiters.get(cacheKey)
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        analytics: false,
        prefix: 'fiora:rl',
      })
      limiters.set(cacheKey, limiter)
    }
    const { success } = await limiter.limit(key)
    return success
  } catch (err) {
    // Si Redis falla, no bloqueamos al usuario — loguear y permitir.
    // La alternativa (fail-closed) cae mal a usuarios legítimos.
    console.error('[ratelimit] Upstash error, fail-open:', err.message)
    return true
  }
}
