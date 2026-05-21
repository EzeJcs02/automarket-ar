import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import crypto from 'crypto'
import handler from '../mp-webhook.js'

const SECRET = 'test-secret-for-hmac'
const MP_PAYMENT_ID = '99999999'

function buildSignature(paymentId, requestId, ts, secret = SECRET) {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex')
}

function makeReq({ paymentId = MP_PAYMENT_ID, requestId = 'req-123', ts = Date.now(), badSig = false, topic = 'payment', method = 'POST' } = {}) {
  const v1 = badSig ? 'deadbeef'.repeat(8) : buildSignature(paymentId, requestId, ts)
  return {
    method,
    headers: {
      'x-signature': `ts=${ts},v1=${v1}`,
      'x-request-id': requestId,
    },
    query: { topic, id: paymentId },
    body: { type: topic, data: { id: paymentId } },
  }
}

function makeRes() {
  const res = { statusCode: 200, _json: null, _end: false }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res._json = b; return res }
  res.end = () => { res._end = true; return res }
  res.setHeader = () => {}
  return res
}

// Mock global fetch para no pegarle a APIs reales
const mockFetch = vi.fn()

beforeEach(() => {
  process.env.MP_WEBHOOK_SECRET = SECRET
  process.env.MP_ACCESS_TOKEN = 'test-mp-token'
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.RESEND_API_KEY = ''
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mp-webhook — autenticación', () => {
  it('rechaza método distinto a POST', async () => {
    const req = makeReq({ method: 'GET' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
  })

  it('rechaza firma inválida con 401', async () => {
    const req = makeReq({ badSig: true })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
    expect(res._json).toEqual({ error: 'Invalid signature' })
  })

  it('rechaza timestamp fuera de la ventana de 5 min (replay attack)', async () => {
    const req = makeReq({ ts: Date.now() - 6 * 60 * 1000 })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('rechaza si falta MP_WEBHOOK_SECRET', async () => {
    delete process.env.MP_WEBHOOK_SECRET
    const req = makeReq()
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(401)
  })
})

describe('mp-webhook — validación de payload', () => {
  it('ignora topics que no son payment', async () => {
    const req = makeReq({ topic: 'merchant_order' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res._json).toEqual({ received: true })
  })

  it('rechaza IDs no numéricos (protección path traversal)', async () => {
    const req = makeReq({ paymentId: '../../../etc/passwd' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
  })
})

describe('mp-webhook — anti-fraude', () => {
  it('rechaza tipo de pago desconocido y registra en pagos_rechazados', async () => {
    const req = makeReq()
    const res = makeRes()
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('api.mercadopago.com')) {
        return new Response(JSON.stringify({
          status: 'approved', status_detail: 'accredited',
          transaction_amount: 50000,
          metadata: { tipo: 'tipo_inventado_fraude' },
        }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })

    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res._json.error).toBe('Tipo de pago no reconocido')
    // Debe haber intentado registrar en pagos_rechazados
    const rechazadoCall = mockFetch.mock.calls.find(c => c[0].includes('pagos_rechazados'))
    expect(rechazadoCall).toBeDefined()
  })

  it('rechaza monto insuficiente para el tipo y registra en pagos_rechazados', async () => {
    const req = makeReq()
    const res = makeRes()
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('api.mercadopago.com')) {
        return new Response(JSON.stringify({
          status: 'approved', status_detail: 'accredited',
          transaction_amount: 100, // muy bajo
          metadata: { tipo: 'destacado' }, // espera 15000
        }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })

    await handler(req, res)
    expect(res._json.error).toBe('Monto insuficiente para el servicio')
    const rechazadoCall = mockFetch.mock.calls.find(c => c[0].includes('pagos_rechazados'))
    expect(rechazadoCall).toBeDefined()
    const body = JSON.parse(rechazadoCall[1].body)
    expect(body.motivo).toBe('monto_insuficiente')
  })

  it('no procesa pagos que no estén approved + accredited', async () => {
    const req = makeReq()
    const res = makeRes()
    mockFetch.mockImplementation(async () => new Response(JSON.stringify({
      status: 'pending', status_detail: 'pending_review',
      transaction_amount: 15000,
      metadata: { tipo: 'destacado' },
    }), { status: 200 }))

    await handler(req, res)
    expect(res._json).toEqual({ received: true, status: 'pending' })
    // No debe haber intentado escribir en supabase
    const supabaseWrite = mockFetch.mock.calls.find(c => c[0].includes('/rest/v1/pagos') && c[1]?.method === 'POST')
    expect(supabaseWrite).toBeUndefined()
  })
})

describe('mp-webhook — idempotencia', () => {
  it('devuelve duplicated si el pago ya está en la tabla pagos', async () => {
    const req = makeReq()
    const res = makeRes()
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('api.mercadopago.com')) {
        return new Response(JSON.stringify({
          status: 'approved', status_detail: 'accredited',
          transaction_amount: 15000,
          metadata: { tipo: 'destacado', auto_id: '00000000-0000-0000-0000-000000000001' },
        }), { status: 200 })
      }
      if (url.includes('/rest/v1/pagos?mp_payment_id=')) {
        // ya existe
        return new Response(JSON.stringify([{ mp_payment_id: MP_PAYMENT_ID }]), { status: 200 })
      }
      return new Response('[]', { status: 200 })
    })

    await handler(req, res)
    expect(res._json).toEqual({ received: true, duplicated: true })
  })
})

describe('mp-webhook — ownership', () => {
  it('rechaza si concesionaria_id del metadata no es la dueña del auto', async () => {
    const req = makeReq()
    const res = makeRes()
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('api.mercadopago.com')) {
        return new Response(JSON.stringify({
          status: 'approved', status_detail: 'accredited',
          transaction_amount: 15000,
          metadata: {
            tipo: 'destacado',
            auto_id: '00000000-0000-0000-0000-000000000001',
            concesionaria_id: '11111111-1111-1111-1111-111111111111',
          },
        }), { status: 200 })
      }
      if (url.includes('/rest/v1/pagos?mp_payment_id=')) {
        return new Response('[]', { status: 200 })
      }
      if (url.includes('/rest/v1/autos?id=')) {
        // auto pertenece a OTRA concesionaria
        return new Response(JSON.stringify([{
          id: '00000000-0000-0000-0000-000000000001',
          concesionaria_id: '22222222-2222-2222-2222-222222222222', // distinta
        }]), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })

    await handler(req, res)
    expect(res._json.error).toMatch(/Ownership mismatch/)
    const rechazadoCall = mockFetch.mock.calls.find(c => c[0].includes('pagos_rechazados'))
    expect(rechazadoCall).toBeDefined()
  })
})
