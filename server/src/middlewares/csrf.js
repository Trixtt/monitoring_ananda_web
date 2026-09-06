import crypto from 'node:crypto'
import { env } from '../config/env.js'

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function setCsrfCookie(res, token) {
  res.cookie('csrfToken', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/'
  })
  return token
}

export function csrfProtect(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  // CSRF hanya relevan untuk sesi berbasis cookie.
  // Klien yang memakai Authorization (Bearer) tidak terkena CSRF.
  if (!req.cookies?.token) return next()

  const header = req.headers['x-csrf-token']
  const cookie = req.cookies?.csrfToken
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ message: 'Token keamanan tidak valid. Muat ulang halaman, lalu coba lagi.' })
  }

  return next()
}