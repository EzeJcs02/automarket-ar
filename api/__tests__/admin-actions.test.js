import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import handler from '../admin-actions.js'

const ADMIN_EMAIL = 'admin@fioramarket.store'

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

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('admin-actions — autenticación', () => {
  it('rechaza sin header Authorization', async () => {
    const req = makeReq({ auth: null })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza si el email autenticado no es el admin', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (String(url).includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ email: 'no-soy-admin@test.com' }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { action: 'aprobar', id: 'x' } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('devuelve 500 si ADMIN_EMAIL no está configurada (no falla en abierto)', async () => {
    delete process.env.ADMIN_EMAIL
    const req = makeReq({ body: { action: 'aprobar', id: 'x' } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
  })
})

describe('admin-actions — propagación de errores de Supabase', () => {
  it('responde 500 si una operación falla, en vez de reportar éxito', async () => {
    mockFetch.mockImplementation(async (url, opts) => {
      if (String(url).includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ email: ADMIN_EMAIL }), { status: 200 })
      }
      if (String(url).includes('/rest/v1/concesionarias') && opts?.method === 'PATCH') {
        // Simula una falla real de Postgres/PostgREST en la escritura.
        return new Response(JSON.stringify({ message: 'constraint violation', code: '23505' }), { status: 409 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { action: 'toggleDestacada', id: 'auto-1', value: true } })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
  })
})
