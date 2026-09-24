import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../admin-users.js'

function makeReq({ auth = 'Bearer tok', method = 'GET' } = {}) {
  return { method, headers: { origin: 'https://fioramarket.store', authorization: auth } }
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
function mockSupabase(caller) {
  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/auth/v1/user')) return new Response(JSON.stringify(caller), { status: 200 })
    if (url.includes('/auth/v1/admin/users')) {
      return new Response(JSON.stringify({ users: [
        { id: '1', email: 'admin@test.com', created_at: 'x', last_sign_in_at: 'y', app_metadata: { role: 'admin' } },
        { id: '2', email: 'otro@test.com', created_at: 'x', last_sign_in_at: 'y', user_metadata: { nombre: 'Otro', role: 'admin' } },
      ] }), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  })
}

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
})

describe('admin-users', () => {
  it('rechaza sin Authorization', async () => {
    const res = makeRes()
    await handler(makeReq({ auth: null }), res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza a un usuario sin rol admin', async () => {
    mockSupabase({ email: 'otro@test.com', app_metadata: {} })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(403)
  })

  it('marca is_admin por app_metadata.role, no por user_metadata', async () => {
    mockSupabase({ email: 'admin@test.com', app_metadata: { role: 'admin' } })
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
    const porId = Object.fromEntries(res._json.users.map(u => [u.id, u]))
    expect(porId['1'].is_admin).toBe(true)
    expect(porId['2'].is_admin).toBe(false)
  })
})
