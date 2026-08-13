import { Op } from 'sequelize'
import { Kelas, TahunAjaran, Mapel, Siswa, User, Artikel } from '../models/index.js'

export async function ringkasanAdmin(req, res) {
  const [siswa, kelas, akun, mapel, artikel] = await Promise.all([
    Siswa.count(),
    Kelas.count(),
    User.count(),
    Mapel.count(),
    Artikel.count()
  ])
  return res.json({ siswa, kelas, akun, mapel, artikel })
}

function errMsg(e, fallback) {
  return { message: e.message?.includes('unique') ? 'Data sudah ada (tidak boleh duplikat).' : fallback }
}

// ---------- Kelas ----------
export async function listKelas(req, res) {
  const kelas = await Kelas.findAll({ order: [['tingkat', 'ASC'], ['nama', 'ASC']] })
  const list = await Promise.all(
    kelas.map(async (k) => ({
      ...k.toJSON(),
      siswaCount: await Siswa.count({ where: { kelasId: k.id } })
    }))
  )
  return res.json({ list })
}
export async function createKelas(req, res) {
  try {
    const { nama, tingkat, waliKelas } = req.body
    const item = await Kelas.create({ nama, tingkat, waliKelas })
    return res.status(201).json({ message: 'Kelas ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah kelas.'))
  }
}
export async function updateKelas(req, res) {
  const item = await Kelas.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Kelas tidak ditemukan.' })
  await item.update(req.body)
  return res.json({ message: 'Kelas diperbarui.', item })
}
export async function deleteKelas(req, res) {
  const item = await Kelas.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Kelas tidak ditemukan.' })
  await item.destroy()
  return res.json({ message: 'Kelas dihapus.' })
}

// ---------- Tahun Ajaran ----------
export async function listTahunAjaran(req, res) {
  const list = await TahunAjaran.findAll({ order: [['id', 'DESC']] })
  return res.json({ list })
}
export async function createTahunAjaran(req, res) {
  try {
    const { nama } = req.body
    const item = await TahunAjaran.create({ nama })
    return res.status(201).json({ message: 'Tahun ajaran ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah tahun ajaran.'))
  }
}
export async function setAktifTahunAjaran(req, res) {
  await TahunAjaran.update({ isActive: false }, { where: {} })
  const item = await TahunAjaran.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Tahun ajaran tidak ditemukan.' })
  item.isActive = true
  await item.save()
  return res.json({ message: 'Tahun ajaran aktif diperbarui.', item })
}
export async function deleteTahunAjaran(req, res) {
  const item = await TahunAjaran.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Tahun ajaran tidak ditemukan.' })
  await item.destroy()
  return res.json({ message: 'Tahun ajaran dihapus.' })
}

// ---------- Mapel ----------
export async function listMapel(req, res) {
  const list = await Mapel.findAll({ order: [['nama', 'ASC']] })
  return res.json({ list })
}
export async function createMapel(req, res) {
  try {
    const { nama } = req.body
    const item = await Mapel.create({ nama })
    return res.status(201).json({ message: 'Mata pelajaran ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah mata pelajaran.'))
  }
}
export async function updateMapel(req, res) {
  const item = await Mapel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' })
  await item.update(req.body)
  return res.json({ message: 'Mata pelajaran diperbarui.', item })
}
export async function deleteMapel(req, res) {
  const item = await Mapel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' })
  await item.destroy()
  return res.json({ message: 'Mata pelajaran dihapus.' })
}

// ---------- Siswa ----------
export async function listSiswa(req, res) {
  const { kelasId, q, tahunAjaranId, page = 1, limit = 25 } = req.query
  const where = {}
  if (kelasId) where.kelasId = Number(kelasId)
  if (tahunAjaranId) where.tahunAjaranId = Number(tahunAjaranId)
  if (q) where.nama = { [Op.like]: `%${q}%` }

  const offset = (Number(page) - 1) * Number(limit)

  const { rows, count } = await Siswa.findAndCountAll({
    where,
    include: [{ association: 'kelas' }, { association: 'tahunAjaran' }],
    order: [['nama', 'ASC']],
    limit: Number(limit),
    offset,
    distinct: true
  })
  return res.json({ list: rows, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) })
}
export async function detailSiswa(req, res) {
  const siswa = await Siswa.findByPk(req.params.id, {
    include: [{ association: 'kelas' }, { association: 'tahunAjaran' }]
  })
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  return res.json({ siswa })
}
export async function createSiswa(req, res) {
  try {
    const item = await Siswa.create(req.body)
    return res.status(201).json({ message: 'Siswa ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah siswa. Periksa kembali data.'))
  }
}
export async function updateSiswa(req, res) {
  const item = await Siswa.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  await item.update(req.body)
  return res.json({ message: 'Siswa diperbarui.', item })
}
export async function deleteSiswa(req, res) {
  const item = await Siswa.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  await item.destroy()
  return res.json({ message: 'Siswa dihapus.' })
}

// ---------- Status ABK (Wali Kelas) ----------
export async function updateAbk(req, res) {
  const siswa = await Siswa.findByPk(req.params.id)
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  siswa.statusABK = Boolean(req.body.statusABK)
  siswa.catatanABK = req.body.catatanABK ?? siswa.catatanABK
  await siswa.save()
  return res.json({ message: 'Status ABK diperbarui.', siswa })
}

// ---------- Autocomplete username orang tua ----------
export function suggestUsername(req, res) {
  const { tahun, absen } = req.query
  if (!tahun || !absen) return res.json({ username: null })
  return res.json({ username: `${tahun}${String(absen).padStart(3, '0')}` })
}

// Helper untuk dipakai controller lain
export async function getSiswaDenganUser(siswaId) {
  return User.findOne({ where: { siswaId, role: 'orang_tua' } })
}
