import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import handler from '../mp-create-preference.js'

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const OTHER_USER_ID = 'bbbbbbbb-0000-0000-0000-000000000002'
const CONCESIONARIA_ID = 'cccccccc-0000-0000-0000-000000000003'

function makeReq({ body = {}, auth = 'Bearer valid-token', method = 'POST', ip = '1.1.1.1' } = {}) {
  return {
    method,
    headers: { origin: 'https://fioramarket.store', authorization: auth, 'x-forwarded-for': ip },
    body,
  }
}

function makeRes() {
  const res = { statusCode: 200, _json: null }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res._json = b; return res }
  res.end = () => res
  res.setHeader = () => {}
  return res
}

const mockFetch = vi.fn()

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.MP_ACCESS_TOKEN = 'test-mp-token'
  process.env.APP_URL = 'https://fioramarket.store'
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: USER_ID, email: 'dueño-real@test.com' }), { status: 200 })
    }
    if (url.includes('/rest/v1/concesionarias')) {
      return new Response(JSON.stringify([{ user_id: USER_ID }]), { status: 200 })
    }
    if (url.includes('checkout/preferences')) {
      return new Response(JSON.stringify({ init_point: 'https://mp.test/checkout' }), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mp-create-preference — autenticación', () => {
  it('rechaza sin header Authorization', async () => {
    const req = makeReq({ auth: null, ip: '2.2.2.1' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza si el token no es válido', async () => {
    mockFetch.mockImplementationOnce(async () => new Response('{}', { status: 401 }))
    const req = makeReq({ body: { tipo: 'destacado' }, ip: '2.2.2.2' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })
})

describe('mp-create-preference — validación', () => {
  it('rechaza un tipo de pago inválido', async () => {
    const req = makeReq({ body: { tipo: 'no_existe' }, ip: '2.2.2.3' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
  })
})

describe('mp-create-preference — ownership', () => {
  it('rechaza si la concesionaria no pertenece al usuario autenticado', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: USER_ID, email: 'x@test.com' }), { status: 200 })
      }
      if (url.includes('/rest/v1/concesionarias')) {
        // pertenece a otro usuario
        return new Response(JSON.stringify([{ user_id: OTHER_USER_ID }]), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { tipo: 'destacado', concesionaria_id: CONCESIONARIA_ID }, ip: '2.2.2.4' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(403)
  })
})

describe('mp-create-preference — email del pagador', () => {
  it('usa el email verificado de la sesión, ignorando el que mande el cliente', async () => {
    const req = makeReq({
      body: { tipo: 'destacado', user_email: 'atacante@evil.com' },
      ip: '2.2.2.5',
    })
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    const mpCall = mockFetch.mock.calls.find(c => c[0].includes('checkout/preferences'))
    expect(mpCall).toBeDefined()
    const sentBody = JSON.parse(mpCall[1].body)
    expect(sentBody.metadata.user_email).toBe('dueño-real@test.com')
    expect(sentBody.metadata.user_id).toBe(USER_ID)
  })
})

describe('mp-create-preference — rate limit', () => {
  it('devuelve 429 después de superar el límite por IP', async () => {
    const ip = '9.9.9.9'
    let lastRes
    for (let i = 0; i < 11; i++) {
      const req = makeReq({ body: { tipo: 'destacado' }, ip })
      lastRes = makeRes()
      await handler(req, lastRes)
    }
    expect(lastRes.statusCode).toBe(429)
  })
})
