import { Op, fn, col } from 'sequelize'
import {
  Kelas,
  TahunAjaran,
  Mapel,
  Siswa,
  User,
  Artikel,
  Nilai,
  Kehadiran,
  Sikap,
  Notifikasi,
  sequelize
} from '../models/index.js'
import { cariSiswaTerakses } from '../services/aksesKelas.js'
import { catatAudit } from '../services/audit.js'

function batasiAngka(nilai, bawaan, min, max) {
  const n = Number(nilai)
  if (!Number.isFinite(n)) return bawaan
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

export async function ringkasanAdmin(req, res) {
  const [siswa, kelas, akun, mapel, artikel, tahunAjaran] = await Promise.all([
    Siswa.count(),
    Kelas.count(),
    User.count(),
    Mapel.count(),
    Artikel.count(),
    TahunAjaran.count()
  ])
  return res.json({ siswa, kelas, akun, mapel, artikel, tahunAjaran })
}

function errMsg(e, fallback) {
  return { message: e.message?.includes('unique') ? 'Data sudah ada (tidak boleh duplikat).' : fallback }
}

// ---------- Kelas ----------
export async function listKelas(req, res) {
  const [kelas, jumlah] = await Promise.all([
    Kelas.findAll({ order: [['tingkat', 'ASC'], ['nama', 'ASC']] }),
    Siswa.findAll({
      attributes: ['kelasId', [fn('COUNT', col('id')), 'jumlah']],
      where: { kelasId: { [Op.ne]: null } },
      group: ['kelasId'],
      raw: true
    })
  ])
  const peta = new Map(jumlah.map((r) => [Number(r.kelasId), Number(r.jumlah)]))
  const list = kelas.map((k) => ({ ...k.toJSON(), siswaCount: peta.get(Number(k.id)) || 0 }))
  return res.json({ list })
}

export async function createKelas(req, res) {
  try {
    const { nama, tingkat, waliKelas } = req.body
    const item = await Kelas.create({ nama, tingkat, waliKelas })
    await catatAudit({ req, action: 'kelas.dibuat', entity: 'kelas', entityId: item.id, detail: { nama } })
    return res.status(201).json({ message: 'Kelas ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah kelas.'))
  }
}

export async function updateKelas(req, res) {
  const item = await Kelas.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Kelas tidak ditemukan.' })
  await item.update(req.body)
  await catatAudit({ req, action: 'kelas.diperbarui', entity: 'kelas', entityId: item.id })
  return res.json({ message: 'Kelas diperbarui.', item })
}

export async function deleteKelas(req, res) {
  const item = await Kelas.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Kelas tidak ditemukan.' })

  const [jumlahSiswa, jumlahAkun] = await Promise.all([
    Siswa.count({ where: { kelasId: item.id } }),
    User.count({ where: { kelasId: item.id } })
  ])
  if (jumlahSiswa > 0 || jumlahAkun > 0) {
    return res.status(409).json({
      message: `Kelas masih terhubung ke ${jumlahSiswa} siswa dan ${jumlahAkun} akun. Pindahkan datanya terlebih dahulu.`
    })
  }

  await item.destroy()
  await catatAudit({ req, action: 'kelas.dihapus', entity: 'kelas', entityId: req.params.id, detail: { nama: item.nama } })
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
    await catatAudit({ req, action: 'tahun_ajaran.dibuat', entity: 'tahun_ajaran', entityId: item.id, detail: { nama } })
    return res.status(201).json({ message: 'Tahun ajaran ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah tahun ajaran.'))
  }
}

export async function setAktifTahunAjaran(req, res) {
  try {
    const item = await sequelize.transaction(async (transaction) => {
      const target = await TahunAjaran.findByPk(req.params.id, { transaction })
      if (!target) {
        const err = new Error('Tahun ajaran tidak ditemukan.')
        err.status = 404
        throw err
      }
      await TahunAjaran.update({ isActive: false }, { where: {}, transaction })
      target.isActive = true
      await target.save({ transaction })
      return target
    })

    await catatAudit({
      req,
      action: 'tahun_ajaran.aktif',
      entity: 'tahun_ajaran',
      entityId: item.id,
      detail: { nama: item.nama }
    })
    return res.json({ message: 'Tahun ajaran aktif diperbarui.', item })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message })
    throw e
  }
}

export async function deleteTahunAjaran(req, res) {
  const item = await TahunAjaran.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Tahun ajaran tidak ditemukan.' })
  if (item.isActive) {
    return res.status(409).json({ message: 'Tahun ajaran aktif tidak boleh dihapus. Aktifkan tahun lain terlebih dahulu.' })
  }

  const [siswa, nilai, kehadiran, sikap] = await Promise.all([
    Siswa.count({ where: { tahunAjaranId: item.id } }),
    Nilai.count({ where: { tahunAjaranId: item.id } }),
    Kehadiran.count({ where: { tahunAjaranId: item.id } }),
    Sikap.count({ where: { tahunAjaranId: item.id } })
  ])
  if (siswa + nilai + kehadiran + sikap > 0) {
    return res.status(409).json({
      message: 'Tahun ajaran masih memiliki data akademik. Nonaktifkan saja agar data historis tetap utuh.'
    })
  }

  await item.destroy()
  await catatAudit({
    req,
    action: 'tahun_ajaran.dihapus',
    entity: 'tahun_ajaran',
    entityId: req.params.id,
    detail: { nama: item.nama }
  })
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
    await catatAudit({ req, action: 'mapel.dibuat', entity: 'mapel', entityId: item.id, detail: { nama } })
    return res.status(201).json({ message: 'Mata pelajaran ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah mata pelajaran.'))
  }
}

export async function updateMapel(req, res) {
  const item = await Mapel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' })
  await item.update(req.body)
  await catatAudit({ req, action: 'mapel.diperbarui', entity: 'mapel', entityId: item.id })
  return res.json({ message: 'Mata pelajaran diperbarui.', item })
}

export async function deleteMapel(req, res) {
  const item = await Mapel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' })

  const dipakai = await Nilai.count({ where: { mapelId: item.id } })
  if (dipakai > 0) {
    return res.status(409).json({ message: `Mata pelajaran masih dipakai oleh ${dipakai} nilai. Data tidak dihapus.` })
  }

  await item.destroy()
  await catatAudit({ req, action: 'mapel.dihapus', entity: 'mapel', entityId: req.params.id, detail: { nama: item.nama } })
  return res.json({ message: 'Mata pelajaran dihapus.' })
}

// ---------- Siswa ----------
export async function listSiswa(req, res) {
  const { kelasId, q, tahunAjaranId } = req.query
  const page = batasiAngka(req.query.page, 1, 1, 100000)
  const limit = batasiAngka(req.query.limit, 25, 1, 5000)
  const where = {}
  if (kelasId) where.kelasId = Number(kelasId)
  if (tahunAjaranId) where.tahunAjaranId = Number(tahunAjaranId)
  if (q) where.nama = { [Op.like]: `%${String(q).slice(0, 100)}%` }

  const offset = (page - 1) * limit

  const { rows, count } = await Siswa.findAndCountAll({
    where,
    include: [{ association: 'kelas' }, { association: 'tahunAjaran' }],
    order: [['nama', 'ASC']],
    limit,
    offset,
    distinct: true
  })
  return res.json({ list: rows, total: count, page, pages: Math.ceil(count / limit) })
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
    await catatAudit({
      req,
      action: 'siswa.dibuat',
      entity: 'siswa',
      entityId: item.id,
      detail: { nama: item.nama, kelasId: item.kelasId }
    })
    return res.status(201).json({ message: 'Siswa ditambahkan.', item })
  } catch (e) {
    return res.status(400).json(errMsg(e, 'Gagal menambah siswa. Periksa kembali data.'))
  }
}

export async function updateSiswa(req, res) {
  const item = await Siswa.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  await item.update(req.body)
  await catatAudit({ req, action: 'siswa.diperbarui', entity: 'siswa', entityId: item.id })
  return res.json({ message: 'Siswa diperbarui.', item })
}

export async function deleteSiswa(req, res) {
  const item = await Siswa.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })

  const snapshot = { nama: item.nama, nisn: item.nisn, kelasId: item.kelasId }

  try {
    await sequelize.transaction(async (transaction) => {
      const akunOrtu = await User.findAll({
        where: { siswaId: item.id, role: 'orang_tua' },
        attributes: ['id'],
        transaction
      })
      const idOrtu = akunOrtu.map((u) => u.id)
      if (idOrtu.length) {
        await Notifikasi.destroy({ where: { userId: { [Op.in]: idOrtu } }, transaction })
        // Akun tidak dihapus agar jejak audit tetap ada, tetapi dinonaktifkan.
        await User.update(
          { active: false, siswaId: null, mustChangePassword: true },
          { where: { id: { [Op.in]: idOrtu } }, transaction }
        )
      }
      await Nilai.destroy({ where: { siswaId: item.id }, transaction })
      await Kehadiran.destroy({ where: { siswaId: item.id }, transaction })
      await Sikap.destroy({ where: { siswaId: item.id }, transaction })
      await item.destroy({ transaction })
    })
  } catch {
    return res.status(409).json({ message: 'Siswa tidak dapat dihapus karena masih terhubung dengan data lain.' })
  }

  await catatAudit({
    req,
    action: 'siswa.dihapus',
    entity: 'siswa',
    entityId: req.params.id,
    detail: snapshot
  })
  return res.json({ message: 'Siswa beserta data akademiknya dihapus.' })
}

// ---------- Status ABK (Wali Kelas) ----------
export async function updateAbk(req, res) {
  const hasil = await cariSiswaTerakses(req.user, req.params.id)
  if (!hasil.siswa) return res.status(hasil.status).json({ message: hasil.message })
  const siswa = hasil.siswa
  const lama = siswa.statusABK
  siswa.statusABK = Boolean(req.body.statusABK)
  siswa.catatanABK = req.body.catatanABK ?? siswa.catatanABK
  await siswa.save()

  await catatAudit({
    req,
    action: 'siswa.abk_diperbarui',
    entity: 'siswa',
    entityId: siswa.id,
    detail: { statusLama: lama, statusBaru: siswa.statusABK }
  })
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
