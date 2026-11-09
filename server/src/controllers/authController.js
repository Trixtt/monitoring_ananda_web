import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { User, Siswa, Kelas, Notifikasi } from '../models/index.js'
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '../middlewares/csrf.js'
import {
  AUTH_COOKIE,
  LEGACY_AUTH_COOKIE,
  bacaTokenDariRequest,
  opsiCookieAuth,
  signToken
} from '../services/authToken.js'
import { validasiPasswordBaru } from '../services/password.js'
import { catatAudit } from '../services/audit.js'

const ROUTES = {
  admin: '/admin',
  wali_kelas: '/guru',
  kepala_sekolah: '/kepsek',
  orang_tua: '/orangtua'
}

// Hash dummy untuk membuat waktu respons login relatif sama ketika
// username tidak ditemukan (mengurangi user enumeration lewat timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-tidak-dipakai', 10)

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

function jwtMaxAgeMs() {
  const m = /^(\d+)([smhd])$/.exec(env.jwtExpiresIn || '12h')
  if (!m) return 12 * 3600 * 1000
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]]
  return Number(m[1]) * mult
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, opsiCookieAuth(jwtMaxAgeMs()))
  if (AUTH_COOKIE !== LEGACY_AUTH_COOKIE) {
    res.clearCookie(LEGACY_AUTH_COOKIE, { path: '/' })
  }
  return token
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { path: '/' })
  res.clearCookie(LEGACY_AUTH_COOKIE, { path: '/' })
}

export async function login(req, res) {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' })
  }

  const user = await User.findOne({ where: { username: String(username).trim() } })
  const hash = user?.password || DUMMY_HASH
  const cocok = await bcrypt.compare(String(password), hash)

  if (!user || !user.active || !cocok) {
    await catatAudit({
      req,
      action: 'login.gagal',
      entity: 'user',
      entityId: user?.id || null,
      detail: { username: String(username).slice(0, 50) }
    })
    return res.status(401).json({ message: 'Username atau password salah.' })
  }

  setAuthCookie(res, signToken(user))
  const csrfToken = setCsrfCookie(res, generateCsrfToken())

  let detail = null
  if (user.role === 'orang_tua' && user.siswaId) {
    detail = await Siswa.findByPk(user.siswaId, { include: [{ association: 'kelas' }] })
  }

  await catatAudit({
    req,
    action: 'login.berhasil',
    entity: 'user',
    entityId: user.id,
    actor: user,
    detail: { role: user.role }
  })

  return res.json({
    user: publicUser(user),
    redirect: ROUTES[user.role],
    csrfToken,
    detail
  })
}

export async function logout(req, res) {
  const token = bacaTokenDariRequest(req)
  if (token) {
    await catatAudit({ req, action: 'logout', entity: 'user', entityId: req.user?.id || null })
  }
  clearAuthCookie(res)
  clearCsrfCookie(res)
  return res.json({ message: 'Logout berhasil.' })
}

export async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    include: [{ association: 'kelas' }, { association: 'siswa', include: [{ association: 'kelas' }] }],
    attributes: { exclude: ['password'] }
  })
  const csrfToken = req.cookies?.csrfToken || req.cookies?.['__Host-csrf'] || setCsrfCookie(res, generateCsrfToken())
  return res.json({ user: publicUser(user), kelas: user.kelas, siswa: user.siswa, csrfToken })
}

export async function changePassword(req, res) {
  const { passwordLama, passwordBaru, konfirmasi } = req.body
  const user = req.user

  if (!passwordLama) {
    return res.status(400).json({ message: 'Password lama wajib diisi.' })
  }
  if (!passwordBaru || !konfirmasi) {
    return res.status(400).json({ message: 'Password baru dan konfirmasi wajib diisi.' })
  }
  if (passwordBaru !== konfirmasi) {
    return res.status(400).json({ message: 'Konfirmasi password tidak cocok.' })
  }

  const cocok = await bcrypt.compare(String(passwordLama), user.password)
  if (!cocok) {
    await catatAudit({ req, action: 'password.gagal', entity: 'user', entityId: user.id })
    return res.status(400).json({ message: 'Password lama salah.' })
  }

  let tanggalLahir = null
  if (user.role === 'orang_tua' && user.siswaId) {
    const siswa = await Siswa.findByPk(user.siswaId, { attributes: ['tanggalLahir'] })
    tanggalLahir = siswa?.tanggalLahir || null
  }

  const masalah = validasiPasswordBaru(passwordBaru, {
    username: user.username,
    name: user.name,
    tanggalLahir
  })
  if (masalah) return res.status(400).json({ message: masalah })

  const samaDenganAwal = await bcrypt.compare(String(passwordBaru), user.password)
  if (samaDenganAwal) {
    return res.status(400).json({ message: 'Password baru tidak boleh sama dengan password sebelumnya.' })
  }

  user.password = await bcrypt.hash(String(passwordBaru), 10)
  user.mustChangePassword = false
  await user.save()

  // Terbitkan token baru agar sesi yang sedang aktif tetap berjalan,
  // sementara seluruh token lama otomatis tidak berlaku.
  setAuthCookie(res, signToken(user))
  const csrfToken = setCsrfCookie(res, generateCsrfToken())

  await catatAudit({ req, action: 'password.diganti', entity: 'user', entityId: user.id })

  return res.json({ message: 'Password berhasil diperbarui.', csrfToken })
}

export async function updateProfile(req, res) {
  const { name, email, phone } = req.body
  const user = req.user
  if (name) user.name = name
  if (email !== undefined) user.email = email
  if (phone !== undefined) user.phone = phone
  await user.save()
  await catatAudit({ req, action: 'profil.diperbarui', entity: 'user', entityId: user.id })
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
