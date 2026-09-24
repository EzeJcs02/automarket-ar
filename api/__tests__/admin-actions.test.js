import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import handler from '../admin-actions.js'

function makeReq({ body = {}, auth = 'Bearer valid-token' } = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://fioramarket.store', authorization: auth },
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

function mockCaller(user) {
  mockFetch.mockImplementation(async (url) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify(user), { status: 200 })
    return new Response('{}', { status: 200 })
  })
}

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('admin-actions — autenticación', () => {
  it('rechaza sin header Authorization', async () => {
    const res = makeRes()
    await handler(makeReq({ auth: null }), res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza a un usuario sin rol admin', async () => {
    mockCaller({ email: 'no-soy-admin@test.com', app_metadata: {} })
    const res = makeRes()
    await handler(makeReq({ body: { action: 'aprobar', id: 'x' } }), res)
    expect(res.statusCode).toBe(403)
  })

  it('no acepta el rol en user_metadata (lo edita el propio usuario)', async () => {
    mockCaller({ email: 'x@test.com', app_metadata: {}, user_metadata: { role: 'admin' } })
    const res = makeRes()
    await handler(makeReq({ body: { action: 'aprobar', id: 'x' } }), res)
    expect(res.statusCode).toBe(403)
  })
})

describe('admin-actions — propagación de errores de Supabase', () => {
  it('responde 500 si una operación falla, en vez de reportar éxito', async () => {
    mockFetch.mockImplementation(async (url, opts) => {
      if (String(url).includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ email: 'admin@test.com', app_metadata: { role: 'admin' } }), { status: 200 })
      }
      if (String(url).includes('/rest/v1/concesionarias') && opts?.method === 'PATCH') {
        return new Response(JSON.stringify({ message: 'constraint violation', code: '23505' }), { status: 409 })
      }
      return new Response('{}', { status: 200 })
    })
    const res = makeRes()
    await handler(makeReq({ body: { action: 'toggleDestacada', id: 'auto-1', value: true } }), res)
    expect(res.statusCode).toBe(500)
  })
})
