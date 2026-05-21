import crypto from 'crypto'

export function buildUnsubscribeToken(alertaId, secret) {
  return crypto.createHmac('sha256', secret).update(String(alertaId)).digest('hex').slice(0, 32)
}

export function verifyUnsubscribeToken(alertaId, token, secret) {
  if (!token || !secret) return false
  const expected = buildUnsubscribeToken(alertaId, secret)
  if (token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
