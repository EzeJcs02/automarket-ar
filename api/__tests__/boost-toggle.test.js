import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import handler from '../boost-toggle.js'

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const OTHER_USER_ID = 'bbbbbbbb-0000-0000-0000-000000000002'
const AUTO_ID = 'cccccccc-0000-0000-0000-000000000003'
const CONC_ID = 'dddddddd-0000-0000-0000-000000000004'

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

function autoRow({ plan = 'pro', destacado = false, urgente = false, userId = USER_ID } = {}) {
  return [{
    id: AUTO_ID,
    destacado,
    urgente,
    concesionaria_id: CONC_ID,
    concesionarias: { id: CONC_ID, user_id: userId, plan },
  }]
}

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
    }
    if (url.includes('/rest/v1/autos') && url.includes('select=id,destacado,urgente')) {
      return new Response(JSON.stringify(autoRow()), { status: 200 })
    }
    if (url.includes('/rest/v1/autos') && url.includes('select=id') && url.includes(`${CONC_ID}`)) {
      return new Response(JSON.stringify([]), { status: 200 }) // sin activos aún
    }
    if (url.includes('/rest/v1/autos')) {
      return new Response('{}', { status: 200 }) // PATCH
    }
    return new Response('{}', { status: 200 })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('boost-toggle — autenticación', () => {
  it('rechaza sin header Authorization', async () => {
    const req = makeReq({ auth: null, body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.1' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza si el token no es válido', async () => {
    mockFetch.mockImplementationOnce(async () => new Response('{}', { status: 401 }))
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.2' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })
})

describe('boost-toggle — validación', () => {
  it('rechaza campo inválido', async () => {
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'aprobada', activar: true }, ip: '2.2.2.3' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('rechaza sin auto_id', async () => {
    const req = makeReq({ body: { campo: 'destacado', activar: true }, ip: '2.2.2.4' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
  })
})

describe('boost-toggle — ownership', () => {
  it('rechaza si el auto no pertenece a una concesionaria del usuario', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify(autoRow({ userId: OTHER_USER_ID })), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.5' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('404 si el auto no existe', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.6' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(404)
  })
})

describe('boost-toggle — límite de plan (server-side, no confía en el cliente)', () => {
  it('rechaza con 402 si el plan no incluye boosts (sin plan reconocido)', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify(autoRow({ plan: null })), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.7' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(402)
  })

  it('rechaza con 402 si ya alcanzó el cupo de destacados del plan', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify(autoRow({ plan: 'pro' })), { status: 200 })
      }
      // plan 'pro' → límite 3; simulamos 3 ya activos
      if (url.includes('/rest/v1/autos') && url.includes('destacado=eq.true')) {
        return new Response(JSON.stringify([{ id: 'a' }, { id: 'b' }, { id: 'c' }]), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.8' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(402)
  })

  it('un cliente que manda un límite/contador falso igual es rechazado (la cuenta la hace el server)', async () => {
    // El body no tiene forma de mandar "destacadosActivos" — esto documenta
    // que el endpoint ignora cualquier dato de conteo del cliente por diseño.
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify(autoRow({ plan: null })), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({
      body: { auto_id: AUTO_ID, campo: 'destacado', activar: true, destacadosActivos: 0, limiteDestacados: 999 },
      ip: '2.2.2.9',
    })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(402)
  })
})

describe('boost-toggle — happy path', () => {
  it('activa destacado dentro de cupo y hace PATCH mutuamente excluyente con urgente', async () => {
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '2.2.2.10' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    const patchCall = mockFetch.mock.calls.find(c => c[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    const sentBody = JSON.parse(patchCall[1].body)
    expect(sentBody).toEqual({ destacado: true, urgente: false })
  })

  it('desactivar no exige cupo', async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      if (url.includes('/rest/v1/autos') && url.includes('concesionarias(')) {
        return new Response(JSON.stringify(autoRow({ plan: 'basico', destacado: true })), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: false }, ip: '2.2.2.11' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
  })
})

describe('boost-toggle — rate limit', () => {
  it('devuelve 429 después de superar el límite por IP', async () => {
    const ip = '9.9.9.10'
    let lastRes
    for (let i = 0; i < 21; i++) {
      const req = makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: false }, ip })
      lastRes = makeRes()
      await handler(req, lastRes)
    }
    expect(lastRes.statusCode).toBe(429)
  })
})

describe('boost-toggle — boosts pagos', () => {
  function mockAuto(extra) {
    const base = mockFetch.getMockImplementation()
    mockFetch.mockImplementation(async (url, opts) => {
      if (url.includes('/rest/v1/autos') && url.includes('select=id,destacado,urgente')) {
        return new Response(JSON.stringify([{ ...autoRow()[0], ...extra }]), { status: 200 })
      }
      return base(url, opts)
    })
  }

  it('no pisa un destacado pago vigente al activar urgente del plan', async () => {
    mockAuto({ destacado: true, destacado_expira_at: new Date(Date.now() + 5 * 864e5).toISOString() })
    const res = makeRes()
    await handler(makeReq({ body: { auto_id: AUTO_ID, campo: 'urgente', activar: true }, ip: '3.3.3.1' }), res)
    expect(res.statusCode).toBe(409)
    expect(mockFetch.mock.calls.find(c => c[1]?.method === 'PATCH')).toBeUndefined()
  })

  it('no deja apagar a mano un boost pago', async () => {
    mockAuto({ destacado: true, destacado_expira_at: new Date(Date.now() + 5 * 864e5).toISOString() })
    const res = makeRes()
    await handler(makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: false }, ip: '3.3.3.2' }), res)
    expect(res.statusCode).toBe(409)
  })

  it('el cupo del plan cuenta solo boosts sin vencimiento (los del plan)', async () => {
    const res = makeRes()
    await handler(makeReq({ body: { auto_id: AUTO_ID, campo: 'destacado', activar: true }, ip: '3.3.3.3' }), res)
    const countCall = mockFetch.mock.calls.find(c => c[0].includes(`concesionaria_id=eq.${CONC_ID}`))
    expect(countCall[0]).toContain('destacado_expira_at=is.null')
  })
})
