import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../send-email.js'

const AUTO_ID = '00000000-0000-0000-0000-0000000000aa'
let ipN = 0

function makeReq(body) {
  return { method: 'POST', headers: { origin: 'https://fioramarket.store', 'x-forwarded-for': `9.9.9.${++ipN}` }, body }
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
function mockDb({ consulta }) {
  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/rest/v1/consultas')) return new Response(JSON.stringify(consulta ? [consulta] : []), { status: 200 })
    if (url.includes('/rest/v1/autos')) {
      return new Response(JSON.stringify([{ marca: 'Ford', modelo: 'Ka', concesionaria_id: 'c1', concesionarias: { email: 'vendedor@test.com', nombre: 'Agencia' } }]), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  })
}
const mailsEnviados = () => mockFetch.mock.calls.filter(c => c[0].includes('api.resend.com'))

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
  process.env.RESEND_API_KEY = 're_test'
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
})

describe('send-email — no sirve de relay', () => {
  it('confirma: no manda si no hay una consulta reciente con ese email', async () => {
    mockDb({ consulta: null })
    const res = makeRes()
    await handler(makeReq({ action: 'confirma', email: 'victima@test.com', nombre: 'x', auto: 'x', auto_id: AUTO_ID }), res)
    expect(res._json.sent).toBe(false)
    expect(mailsEnviados()).toHaveLength(0)
  })

  it('consulta: no manda si no hay una consulta reciente con ese email', async () => {
    mockDb({ consulta: null })
    const res = makeRes()
    await handler(makeReq({ action: 'consulta', email: 'a@test.com', nombre: 'x', mensaje: 'hola', auto_id: AUTO_ID }), res)
    expect(res._json.sent).toBe(false)
    expect(mailsEnviados()).toHaveLength(0)
  })

  it('consulta: manda al vendedor usando los datos guardados, no los del body', async () => {
    mockDb({ consulta: { nombre_comprador: 'Nombre real', email_comprador: 'a@test.com', mensaje: 'Mensaje real', telefono_comprador: null } })
    const res = makeRes()
    await handler(makeReq({ action: 'consulta', email: 'a@test.com', nombre: 'Inyectado', mensaje: 'Inyectado', auto_id: AUTO_ID }), res)
    expect(res._json.sent).toBe(true)
    const body = JSON.parse(mailsEnviados()[0][1].body)
    expect(body.to).toEqual(['vendedor@test.com'])
    expect(body.html).toContain('Mensaje real')
    expect(body.html).not.toContain('Inyectado')
  })
})
