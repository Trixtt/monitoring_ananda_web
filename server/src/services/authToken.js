import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// Nama cookie memakai prefix __Host- saat produksi agar tidak bisa ditimpa
// oleh subdomain lain. Di development tetap memakai nama sederhana supaya
// nyaman dipakai lewat http://localhost.
export const AUTH_COOKIE = env.isProduction ? '__Host-token' : 'token'
export const LEGACY_AUTH_COOKIE = 'token'
export const CSRF_COOKIE = env.isProduction ? '__Host-csrf' : 'csrfToken'
export const LEGACY_CSRF_COOKIE = 'csrfToken'

export function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 24)
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      // pv berubah otomatis saat password diganti, sehingga token lama
      // langsung tidak berlaku tanpa perlu tabel tambahan.
      pv: passwordFingerprint(user.password)
    },
    env.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  })
}

export function bacaTokenDariRequest(req) {
  const header = req.headers?.authorization || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  return (
    req.cookies?.[AUTH_COOKIE] ||
    req.cookies?.[LEGACY_AUTH_COOKIE] ||
    bearer ||
    null
  )
}

export function opsiCookieAuth(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    ...(maxAge ? { maxAge } : {})
  }
}

export function opsiCookieCsrf() {
  return {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/'
  }
}
