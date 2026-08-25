import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { User, Siswa, Kelas } from '../models/index.js'

const LABEL_ROLE = {
  admin: 'Admin',
  wali_kelas: 'Wali Kelas',
  kepala_sekolah: 'Kepala Sekolah',
  orang_tua: 'Orang Tua'
}

async function syncWaliKelas({ kelasIdBaru, namaBaru, kelasIdLama = null, namaLama = null, jadiWali = true }) {
  if (kelasIdLama && (!jadiWali || kelasIdLama !== kelasIdBaru)) {
    const lama = await Kelas.findByPk(kelasIdLama)
    if (lama && (lama.waliKelas === namaLama || lama.waliKelas === namaBaru)) {
      await lama.update({ waliKelas: null })
    }
  }
  if (jadiWali && kelasIdBaru) {
    const baru = await Kelas.findByPk(kelasIdBaru)
    if (baru) await baru.update({ waliKelas: namaBaru })
  }
}

export async function listAkun(req, res) {
  const { role, q, page = 1, limit = 25 } = req.query
  const where = {}
  if (role) where.role = role
  if (q) {
    const s = `%${q}%`
    where[Op.or] = [{ name: { [Op.like]: s } }, { username: { [Op.like]: s } }]
  }

  const offset = (Number(page) - 1) * Number(limit)

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ association: 'kelas' }, { association: 'siswa' }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
    distinct: true
  })
  const data = rows.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    roleLabel: LABEL_ROLE[u.role],
    name: u.name,
    phone: u.phone,
    email: u.email,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    kelas: u.kelas?.nama || null,
    siswa: u.siswa?.nama || null,
    createdAt: u.createdAt
  }))
  return res.json({ list: data, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) })
}

export async function createAkun(req, res) {
  const { username, password, name, role, phone, email, kelasId, siswaId } = req.body

  if (!username || !name || !role) {
    return res.status(400).json({ message: 'Username, nama, dan role wajib diisi.' })
  }

  const ada = await User.findOne({ where: { username } })
  if (ada) return res.status(400).json({ message: 'Username sudah digunakan.' })

  let passwordAwal = 'password123'
  if (role === 'orang_tua' && siswaId) {
    const siswa = await Siswa.findByPk(siswaId)
    if (siswa?.tanggalLahir) {
      passwordAwal = siswa.tanggalLahir.replaceAll('-', '')
    }
  }

  const user = await User.create({
    username,
    password: bcrypt.hashSync(password || passwordAwal, 10),
    name,
    role,
    phone,
    email,
    kelasId: kelasId || null,
    siswaId: siswaId || null,
    active: true,
    mustChangePassword: role === 'orang_tua'
  })

  if (role === 'wali_kelas' && kelasId) {
    await syncWaliKelas({ kelasIdBaru: Number(kelasId), namaBaru: name })
  }

  return res.status(201).json({
    message: 'Akun dibuat.',
    user: { id: user.id, username: user.username, role: user.role, mustChangePassword: user.mustChangePassword },
    passwordAwal: role === 'orang_tua' ? passwordAwal : password || passwordAwal
  })
}

export async function updateAkun(req, res) {
  const user = await User.findByPk(req.params.id)
  if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' })

  const namaLama = user.name
  const roleLama = user.role
  const kelasLama = user.kelasId

  const { name, phone, email, role, kelasId, siswaId, active } = req.body
  if (name !== undefined) user.name = name
  if (phone !== undefined) user.phone = phone
  if (email !== undefined) user.email = email
  if (role !== undefined) user.role = role
  if (kelasId !== undefined) user.kelasId = kelasId
  if (siswaId !== undefined) user.siswaId = siswaId
  if (active !== undefined) user.active = Boolean(active)
  await user.save()

  await syncWaliKelas({
    kelasIdBaru: user.role === 'wali_kelas' ? user.kelasId : null,
    namaBaru: user.name,
    kelasIdLama: roleLama === 'wali_kelas' ? kelasLama : null,
    namaLama,
    jadiWali: user.role === 'wali_kelas'
  })

  return res.json({ message: 'Akun diperbarui.', user })
}

export async function resetPassword(req, res) {
  const user = await User.findByPk(req.params.id)
  if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' })

  let passwordBaru = 'password123'

  if (user.role === 'orang_tua' && user.siswaId) {
    const siswa = await Siswa.findByPk(user.siswaId)
    if (siswa?.tanggalLahir) {
      passwordBaru = siswa.tanggalLahir.replaceAll('-', '')
    }
  }

  user.password = bcrypt.hashSync(passwordBaru, 10)
  user.mustChangePassword = true
  await user.save()

  return res.json({ message: 'Password direset ke password awal.', passwordBaru })
}

export async function listSiswaUntukAkun(req, res) {
  const list = await Siswa.findAll({
    include: [{ association: 'kelas' }],
    order: [['nama', 'ASC']]
  })
  return res.json({ list })
}
