import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../admin-users.js'

const ADMIN = 'admin@test.com'

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
function mockSupabase(callerEmail) {
  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ email: callerEmail }), { status: 200 })
    if (url.includes('/auth/v1/admin/users')) {
      return new Response(JSON.stringify({ users: [
        { id: '1', email: ADMIN, created_at: 'x', last_sign_in_at: 'y' },
        { id: '2', email: 'otro@test.com', created_at: 'x', last_sign_in_at: 'y', user_metadata: { nombre: 'Otro' } },
      ] }), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  })
}

beforeEach(() => {
  process.env.ADMIN_EMAIL = ADMIN
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

  it('rechaza a un usuario que no es el admin', async () => {
    mockSupabase('otro@test.com')
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(403)
  })

  it('marca is_admin en el servidor, sin exponer el email del admin como configuración', async () => {
    mockSupabase(ADMIN)
    const res = makeRes()
    await handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
    const porId = Object.fromEntries(res._json.users.map(u => [u.id, u]))
    expect(porId['1'].is_admin).toBe(true)
    expect(porId['2'].is_admin).toBe(false)
  })
})
