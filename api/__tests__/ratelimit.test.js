import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Fuerza el branch de Upstash configurado (si no hay URL/TOKEN, la lib usa
// el fallback en memoria y nunca ejercita el catch que estamos probando).
process.env.UPSTASH_REDIS_REST_URL = 'https://test-upstash.example.com'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

vi.mock('@upstash/redis', () => ({ Redis: class { } }))

const limitMock = vi.fn()
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    class { limit(...args) { return limitMock(...args) } },
    { slidingWindow: vi.fn() }
  ),
}))

const { rateLimit } = await import('../_lib/ratelimit.js')

beforeEach(() => {
  limitMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('rateLimit — comportamiento normal (Upstash responde)', () => {
  it('permite cuando Upstash dice success:true', async () => {
    limitMock.mockResolvedValueOnce({ success: true })
    const ok = await rateLimit('test-ns', '1.1.1.1', { limit: 5, windowSec: 60 })
    expect(ok).toBe(true)
  })

  it('bloquea cuando Upstash dice success:false', async () => {
    limitMock.mockResolvedValueOnce({ success: false })
    const ok = await rateLimit('test-ns', '1.1.1.2', { limit: 5, windowSec: 60 })
    expect(ok).toBe(false)
  })
})

describe('rateLimit — Upstash cae (H-05/H-06)', () => {
  it('fail-open por default (comportamiento existente, sin romper endpoints no marcados)', async () => {
    limitMock.mockRejectedValueOnce(new Error('ECONNRESET'))
    const ok = await rateLimit('test-ns', '2.2.2.1', { limit: 5, windowSec: 60 })
    expect(ok).toBe(true)
  })

  it('fail-closed cuando el endpoint pide failClosed:true (arrepentimiento/notify/send-email)', async () => {
    limitMock.mockRejectedValueOnce(new Error('ECONNRESET'))
    const ok = await rateLimit('test-ns', '2.2.2.2', { limit: 5, windowSec: 60, failClosed: true })
    expect(ok).toBe(false)
  })
})
