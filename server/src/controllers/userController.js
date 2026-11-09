import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { User, Siswa, Kelas, sequelize } from '../models/index.js'
import { buatPasswordSementara, validasiPasswordBaru } from '../services/password.js'
import { catatAudit } from '../services/audit.js'

const LABEL_ROLE = {
  admin: 'Admin',
  wali_kelas: 'Wali Kelas',
  kepala_sekolah: 'Kepala Sekolah',
  orang_tua: 'Orang Tua'
}

const ROLE_VALID = new Set(Object.keys(LABEL_ROLE))

function batasiAngka(nilai, bawaan, min, max) {
  const n = Number(nilai)
  if (!Number.isFinite(n)) return bawaan
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function dtoAkun(u) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    roleLabel: LABEL_ROLE[u.role],
    name: u.name,
    phone: u.phone,
    email: u.email,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    kelasId: u.kelasId || null,
    siswaId: u.siswaId || null,
    kelas: u.kelas?.nama || null,
    siswa: u.siswa?.nama || null,
    createdAt: u.createdAt
  }
}

function validasiRelasiRole(role, kelasId, siswaId) {
  if (!ROLE_VALID.has(role)) return 'Role tidak valid.'
  if (role === 'wali_kelas' && !kelasId) return 'Akun wali kelas wajib memiliki kelas.'
  if (role === 'orang_tua' && !siswaId) return 'Akun orang tua wajib ditautkan ke siswa.'
  if (['admin', 'kepala_sekolah'].includes(role) && (kelasId || siswaId)) {
    return 'Akun admin/kepala sekolah tidak boleh ditautkan ke kelas atau siswa.'
  }
  return null
}

async function syncWaliKelas(
  { kelasIdBaru, namaBaru, kelasIdLama = null, namaLama = null, jadiWali = true },
  transaction
) {
  if (kelasIdLama && (!jadiWali || kelasIdLama !== kelasIdBaru)) {
    const lama = await Kelas.findByPk(kelasIdLama, { transaction })
    if (lama && (lama.waliKelas === namaLama || lama.waliKelas === namaBaru)) {
      await lama.update({ waliKelas: null }, { transaction })
    }
  }
  if (jadiWali && kelasIdBaru) {
    const baru = await Kelas.findByPk(kelasIdBaru, { transaction })
    if (baru) await baru.update({ waliKelas: namaBaru }, { transaction })
  }
}

async function pastikanRelasiAda({ kelasId, siswaId }, transaction) {
  if (kelasId) {
    const kelas = await Kelas.findByPk(kelasId, { transaction })
    if (!kelas) return 'Kelas tidak ditemukan.'
  }
  if (siswaId) {
    const siswa = await Siswa.findByPk(siswaId, { transaction })
    if (!siswa) return 'Siswa tidak ditemukan.'
  }
  return null
}

export async function listAkun(req, res) {
  const { role, q } = req.query
  const page = batasiAngka(req.query.page, 1, 1, 100000)
  const limit = batasiAngka(req.query.limit, 25, 1, 5000)
  const where = {}
  if (role && ROLE_VALID.has(role)) where.role = role
  if (q) {
    const s = `%${String(q).slice(0, 100)}%`
    where[Op.or] = [{ name: { [Op.like]: s } }, { username: { [Op.like]: s } }, { '$siswa.nama$': { [Op.like]: s } }]
  }

  const offset = (page - 1) * limit

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [
      { association: 'kelas', attributes: ['id', 'nama'] },
      { association: 'siswa', attributes: ['id', 'nama'] }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true
  })
  const data = rows.map(dtoAkun)
  return res.json({ list: data, total: count, page, pages: Math.ceil(count / limit) })
}

export async function createAkun(req, res) {
  const { username, password, name, role, phone, email, kelasId, siswaId } = req.body

  if (!username || !name || !role) {
    return res.status(400).json({ message: 'Username, nama, dan role wajib diisi.' })
  }

  const masalahRelasi = validasiRelasiRole(role, kelasId, siswaId)
  if (masalahRelasi) return res.status(400).json({ message: masalahRelasi })

  const ada = await User.findOne({ where: { username } })
  if (ada) return res.status(400).json({ message: 'Username sudah digunakan.' })

  const passwordDiberikan = typeof password === 'string' && password.length > 0
  let passwordAwal = password
  if (passwordDiberikan) {
    const masalahPassword = validasiPasswordBaru(password, { username, name })
    if (masalahPassword) return res.status(400).json({ message: masalahPassword })
  } else {
    passwordAwal = buatPasswordSementara()
  }

  try {
    const hasil = await sequelize.transaction(async (transaction) => {
      const relasiSalah = await pastikanRelasiAda({ kelasId, siswaId }, transaction)
      if (relasiSalah) {
        const err = new Error(relasiSalah)
        err.status = 400
        throw err
      }

      const user = await User.create(
        {
          username,
          password: bcrypt.hashSync(passwordAwal, 10),
          name,
          role,
          phone,
          email,
          kelasId: kelasId || null,
          siswaId: siswaId || null,
          active: true,
          mustChangePassword: true
        },
        { transaction }
      )

      if (role === 'wali_kelas' && kelasId) {
        await syncWaliKelas({ kelasIdBaru: Number(kelasId), namaBaru: name }, transaction)
      }

      return user
    })

    await catatAudit({
      req,
      action: 'akun.dibuat',
      entity: 'user',
      entityId: hasil.id,
      detail: { username: hasil.username, role: hasil.role, passwordDibuatOtomatis: !passwordDiberikan }
    })

    return res.status(201).json({
      message: 'Akun dibuat. Pengguna wajib mengganti password saat pertama kali masuk.',
      user: dtoAkun(hasil),
      // Password sementara hanya ditampilkan sekali kepada admin yang membuat akun.
      temporaryPassword: passwordDiberikan ? undefined : passwordAwal,
      mustChangePassword: true
    })
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ message: e.message })
    return res.status(400).json({
      message: e.message?.includes('unique') ? 'Username sudah digunakan.' : 'Gagal membuat akun.'
    })
  }
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

  const masalahRelasi = validasiRelasiRole(user.role, user.kelasId, user.siswaId)
  if (masalahRelasi) return res.status(400).json({ message: masalahRelasi })

  try {
    await sequelize.transaction(async (transaction) => {
      const relasiSalah = await pastikanRelasiAda(
        { kelasId: user.kelasId, siswaId: user.siswaId },
        transaction
      )
      if (relasiSalah) {
        const err = new Error(relasiSalah)
        err.status = 400
        throw err
      }

      await user.save({ transaction })

      await syncWaliKelas(
        {
          kelasIdBaru: user.role === 'wali_kelas' ? user.kelasId : null,
          namaBaru: user.name,
          kelasIdLama: roleLama === 'wali_kelas' ? kelasLama : null,
          namaLama,
          jadiWali: user.role === 'wali_kelas'
        },
        transaction
      )
    })
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ message: e.message })
    return res.status(400).json({ message: 'Gagal memperbarui akun.' })
  }

  await catatAudit({
    req,
    action: 'akun.diperbarui',
    entity: 'user',
    entityId: user.id,
    detail: { roleLama, roleBaru: user.role, active: user.active }
  })

  return res.json({ message: 'Akun diperbarui.', user: dtoAkun(user) })
}

export async function resetPassword(req, res) {
  const user = await User.findByPk(req.params.id)
  if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' })

  const passwordBaru = buatPasswordSementara()
  user.password = bcrypt.hashSync(passwordBaru, 10)
  user.mustChangePassword = true
  await user.save()

  await catatAudit({ req, action: 'password.direset', entity: 'user', entityId: user.id })

  return res.json({
    message: 'Password direset. Sampaikan password sementara kepada pengguna; wajib diganti saat login.',
    temporaryPassword: passwordBaru
  })
}

export async function listSiswaUntukAkun(req, res) {
  const list = await Siswa.findAll({
    include: [{ association: 'kelas', attributes: ['id', 'nama'] }],
    order: [['nama', 'ASC']]
  })
  return res.json({ list })
}
