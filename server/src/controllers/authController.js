import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User, Siswa, Kelas, Notifikasi } from '../models/index.js'

const ROUTES = {
  admin: '/admin',
  wali_kelas: '/guru',
  kepala_sekolah: '/kepsek',
  orang_tua: '/orangtua'
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photo: user.photo,
    mustChangePassword: user.mustChangePassword,
    kelasId: user.kelasId || null,
    siswaId: user.siswaId || null
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

function jwtMaxAgeMs() {
  const m = /^(\d+)([smhd])$/.exec(env.jwtExpiresIn || '12h')
  if (!m) return 12 * 3600 * 1000
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]]
  return Number(m[1]) * mult
}

export function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
    maxAge: jwtMaxAgeMs()
  })
}

export async function login(req, res) {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' })
  }

  const user = await User.findOne({ where: { username: String(username).trim() } })
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Username atau password salah.' })
  }

  const cocok = await bcrypt.compare(password, user.password)
  if (!cocok) {
    return res.status(401).json({ message: 'Username atau password salah.' })
  }

  setAuthCookie(res, signToken(user))

  let detail = null
  if (user.role === 'orang_tua' && user.siswaId) {
    detail = await Siswa.findByPk(user.siswaId, { include: [{ association: 'kelas' }] })
  }

  return res.json({
    user: publicUser(user),
    redirect: ROUTES[user.role],
    detail
  })
}

export async function logout(req, res) {
  res.clearCookie('token', { path: '/' })
  return res.json({ message: 'Logout berhasil.' })
}

export async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    include: [{ association: 'kelas' }, { association: 'siswa', include: [{ association: 'kelas' }] }]
  })
  return res.json({ user: publicUser(user), kelas: user.kelas, siswa: user.siswa })
}

export async function changePassword(req, res) {
  const { passwordLama, passwordBaru, konfirmasi } = req.body
  const user = req.user

  if (!passwordBaru || !konfirmasi) {
    return res.status(400).json({ message: 'Password baru dan konfirmasi wajib diisi.' })
  }
  if (passwordBaru !== konfirmasi) {
    return res.status(400).json({ message: 'Konfirmasi password tidak cocok.' })
  }
  if (String(passwordBaru).length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' })
  }

  if (passwordLama) {
    const cocok = await bcrypt.compare(passwordLama, user.password)
    if (!cocok) {
      return res.status(400).json({ message: 'Password lama salah.' })
    }
  }

  const samaDenganAwal = await bcrypt.compare(passwordBaru, user.password)
  if (samaDenganAwal) {
    return res.status(400).json({ message: 'Password baru tidak boleh sama dengan password sebelumnya.' })
  }

  user.password = await bcrypt.hash(passwordBaru, 10)
  user.mustChangePassword = false
  await user.save()

  return res.json({ message: 'Password berhasil diperbarui.' })
}

export async function updateProfile(req, res) {
  const { name, email, phone } = req.body
  const user = req.user
  if (name) user.name = name
  if (email !== undefined) user.email = email
  if (phone !== undefined) user.phone = phone
  await user.save()
  return res.json({ message: 'Profil diperbarui.', user: publicUser(user) })
}

export async function unreadCount(req, res) {
  const count = await Notifikasi.count({ where: { userId: req.user.id, isRead: false } })
  return res.json({ count })
}

export async function listNotifikasi(req, res) {
  const list = await Notifikasi.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50
  })
  return res.json({ list })
}

export async function bacaNotifikasi(req, res) {
  const notif = await Notifikasi.findOne({
    where: { id: req.params.id, userId: req.user.id }
  })
  if (!notif) return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' })
  notif.isRead = true
  await notif.save()
  return res.json({ message: 'OK' })
}

export async function bacaSemuaNotifikasi(req, res) {
  await Notifikasi.update({ isRead: true }, { where: { userId: req.user.id } })
  return res.json({ message: 'OK' })
}

export { Kelas }
