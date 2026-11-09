import { User } from '../models/index.js'
import { bacaTokenDariRequest, passwordFingerprint, verifyToken } from '../services/authToken.js'

const PATH_BOLEH_GANTI_PASSWORD = new Set([
  '/api/auth/change-password',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/notifikasi',
  '/api/auth/notifikasi/list'
])

function bolehTetapMasukSaatWajibGantiPassword(originalUrl) {
  const path = String(originalUrl || '').split('?')[0]
  return PATH_BOLEH_GANTI_PASSWORD.has(path)
}

async function userDariToken(token) {
  const payload = verifyToken(token)
  if (!payload?.id) return null

  const user = await User.findByPk(payload.id)
  if (!user || !user.active) return null

  // Token yang ditandatangani sebelum password terakhir diganti otomatis
  // ditolak karena sidik jari password tidak cocok lagi.
  if (!payload.pv || payload.pv !== passwordFingerprint(user.password)) return null

  return user
}

export async function auth(req, res, next) {
  try {
    const token = bacaTokenDariRequest(req)
    if (!token) return res.status(401).json({ message: 'Tidak ada sesi. Silakan login kembali.' })

    const user = await userDariToken(token)
    if (!user) return res.status(401).json({ message: 'Sesi berakhir. Silakan login kembali.' })

    if (user.mustChangePassword && !bolehTetapMasukSaatWajibGantiPassword(req.originalUrl)) {
      return res.status(403).json({
        message: 'Anda wajib mengganti password awal sebelum memakai fitur lain.',
        code: 'PASSWORD_CHANGE_REQUIRED'
      })
    }

    req.user = user
    return next()
  } catch {
    return res.status(401).json({ message: 'Sesi berakhir. Silakan login kembali.' })
  }
}

export async function optionalAuth(req, res, next) {
  const token = bacaTokenDariRequest(req)
  if (!token) return next()
  try {
    const user = await userDariToken(token)
    if (user) req.user = user
  } catch {
    // Token tidak valid pada endpoint publik diabaikan saja.
  }
  return next()
}

export function rbac(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke fitur ini.' })
    }
    next()
  }
}

export { userDariToken }
