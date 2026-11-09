import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { CSRF_COOKIE, LEGACY_CSRF_COOKIE, opsiCookieCsrf } from '../services/authToken.js'

function signature(raw) {
  return crypto.createHmac('sha256', `${env.jwtSecret}:csrf`).update(raw).digest('hex')
}

export function generateCsrfToken() {
  const raw = crypto.randomBytes(32).toString('hex')
  return `${raw}.${signature(raw)}`
}

export function verifyCsrfToken(token) {
  const [raw, sig] = String(token || '').split('.')
  if (!raw || !sig) return false
  const expected = signature(raw)
  if (sig.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

function samaAman(a, b) {
  const bufA = Buffer.from(String(a || ''))
  const bufB = Buffer.from(String(b || ''))
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE, token, opsiCookieCsrf())
  // Hapus cookie lama jika nama berubah (mis. saat pindah ke __Host-).
  if (CSRF_COOKIE !== LEGACY_CSRF_COOKIE) {
    res.clearCookie(LEGACY_CSRF_COOKIE, { path: '/' })
  }
  return token
}

export function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE, { path: '/' })
  res.clearCookie(LEGACY_CSRF_COOKIE, { path: '/' })
}

export function csrfProtect(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  // CSRF hanya relevan untuk sesi berbasis cookie.
  // Klien yang memakai Authorization (Bearer) tidak terkena CSRF.
  if (!req.cookies?.token && !req.cookies?.['__Host-token']) return next()

  const header = req.headers['x-csrf-token']
  const cookie = req.cookies?.[CSRF_COOKIE] || req.cookies?.[LEGACY_CSRF_COOKIE]
  if (!header || !cookie || !samaAman(header, cookie) || !verifyCsrfToken(cookie)) {
    return res.status(403).json({ message: 'Token keamanan tidak valid. Muat ulang halaman, lalu coba lagi.' })
  }

  return next()
}
