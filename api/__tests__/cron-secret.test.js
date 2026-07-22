import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import cronExpireBoosts from '../cron-expire-boosts.js'
import cronAlertas from '../cron-alertas.js'

function makeReq(auth) {
  return { method: 'GET', headers: { authorization: auth }, query: {} }
}

function makeRes() {
  const res = { statusCode: 200, _json: null }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res._json = b; return res }
  res.end = () => res
  res.setHeader = () => {}
  return res
}

const mockFetch = vi.fn(async () => new Response('[]', { status: 200 }))

beforeEach(() => {
  globalThis.fetch = mockFetch
  mockFetch.mockClear()
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each([
  ['cron-expire-boosts', cronExpireBoosts],
  ['cron-alertas', cronAlertas],
])('%s — candado de CRON_SECRET', (_name, handler) => {
  it('rechaza si CRON_SECRET no está configurada, incluso mandando "Bearer undefined"', async () => {
    delete process.env.CRON_SECRET
    const req = makeReq('Bearer undefined')
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza un secreto incorrecto', async () => {
    process.env.CRON_SECRET = 'el-secreto-real'
    const req = makeReq('Bearer otra-cosa')
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('permite pasar con el secreto correcto', async () => {
    process.env.CRON_SECRET = 'el-secreto-real'
    const req = makeReq('Bearer el-secreto-real')
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).not.toBe(401)
  })
})
