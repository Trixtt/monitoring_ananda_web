import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/index.js'

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Tidak ada sesi. Silakan login kembali.' })

    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findByPk(payload.id)
    if (!user || !user.active) return res.status(401).json({ message: 'Akun tidak ditemukan atau dinonaktifkan.' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Sesi berakhir. Silakan login kembali.' })
  }
}

export function rbac(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke fitur ini.' })
    }
    next()
  }
}
