import { Op } from 'sequelize'
import { Siswa, Nilai, Kehadiran, Sikap, TahunAjaran, Mapel } from '../models/index.js'
import { hitungSkorSiswa, mapelTerlemah, rekomendasiUntuk } from '../services/spk.js'
import { susunRapor } from '../services/rapor.js'

export async function ortuDashboard(req, res) {
  const siswa = req.user.siswaId
    ? await Siswa.findByPk(req.user.siswaId, { include: [{ association: 'kelas' }] })
    : null

  if (!siswa) {
    return res.status(404).json({ message: 'Data siswa belum tertaut ke akun ini. Hubungi admin.' })
  }

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const skor = await hitungSkorSiswa(siswa.id, ta?.id)
  const lemah = await mapelTerlemah(siswa.id, ta?.id)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  const [nilai, kehadiran, sikap] = await Promise.all([
    Nilai.findAll({
      where: { siswaId: siswa.id, tahunAjaranId: ta?.id },
      include: [{ association: 'mapel' }],
      order: [['createdAt', 'DESC']],
      limit: 30
    }),
    Kehadiran.findAll({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id } }),
    Sikap.findAll({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id }, order: [['createdAt', 'DESC']] })
  ])

  const ringkas = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  kehadiran.forEach((k) => {
    if (ringkas[k.status] !== undefined) ringkas[k.status]++
  })

  return res.json({
    siswa,
    tahunAjaran: ta?.nama || null,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi,
    nilai,
    kehadiran,
    ringkasKehadiran: ringkas,
    sikap
  })
}

export async function ortuRekapNilai(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const mapel = await Mapel.findAll({ order: [['nama', 'ASC']] })

  const rekap = []
  for (const m of mapel) {
    const nilai = await Nilai.findAll({
      where: { siswaId, mapelId: m.id, tahunAjaranId: ta?.id },
      order: [['createdAt', 'DESC']]
    })
    if (!nilai.length) continue
    const rata = nilai.reduce((a, b) => a + b.nilai, 0) / nilai.length
    rekap.push({ mapel: m.nama, daftar: nilai, rata: Math.round(rata * 10) / 10 })
  }

  return res.json({ rekap })
}

export async function ortuProfil(req, res) {
  const siswa = req.user.siswaId
    ? await Siswa.findByPk(req.user.siswaId, { include: [{ association: 'kelas' }] })
    : null
  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  return res.json({ siswa, tahunAjaran: ta?.nama || null })
}

export async function ortuKehadiran(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const list = await Kehadiran.findAll({
    where: { siswaId, tahunAjaranId: ta?.id },
    order: [['tanggal', 'DESC']]
  })

  const ringkas = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  list.forEach((k) => {
    if (ringkas[k.status] !== undefined) ringkas[k.status]++
  })

  return res.json({ ringkas, list })
}

export async function ortuSikap(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const list = await Sikap.findAll({
    where: { siswaId, tahunAjaranId: ta?.id },
    order: [['tanggal', 'DESC'], ['createdAt', 'DESC']]
  })

  const ringkas = { spiritual: { jumlah: 0, total: 0 }, sosial: { jumlah: 0, total: 0 } }
  list.forEach((s) => {
    if (ringkas[s.jenis]) {
      ringkas[s.jenis].jumlah++
      ringkas[s.jenis].total += Number(s.nilai)
    }
  })

  return res.json({ ringkas, list })
}

export async function ortuRapor(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const rapor = await susunRapor({ siswaId })
  if (!rapor) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' })

  return res.json({ rapor })
}

export async function ortuMonitoring(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null

  let y = new Date().getFullYear()
  let m = new Date().getMonth()
  const md = String(req.query.bulan || '').match(/^(\d{4})-(\d{2})$/)
  if (md) {
    y = Number(md[1])
    m = Number(md[2]) - 1
  }
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
  const base = { tahunAjaranId: ta?.id, tanggal: { [Op.like]: `${prefix}%` } }

  const [kehadiran, sikap] = await Promise.all([
    Kehadiran.findAll({
      where: { siswaId, ...base },
      order: [['tanggal', 'ASC']]
    }),
    Sikap.findAll({
      where: { siswaId, ...base },
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    })
  ])

  const kehadiranMap = {}
  kehadiran.forEach((k) => {
    kehadiranMap[k.tanggal] = { tanggal: k.tanggal, status: k.status, keterangan: k.keterangan }
  })

  const sikapMap = {}
  sikap.forEach((s) => {
    const key = s.tanggal
    if (!sikapMap[key]) {
      sikapMap[key] = { tanggal: key, total: 0, jumlah: 0, catatan: null }
    }
    sikapMap[key].total += Number(s.nilai)
    sikapMap[key].jumlah++
    if (s.catatan && !sikapMap[key].catatan) sikapMap[key].catatan = s.catatan
  })

  const sikapList = Object.values(sikapMap).map((s) => ({
    tanggal: s.tanggal,
    nilaiRata: s.jumlah ? Math.round((s.total / s.jumlah) * 10) / 10 : null,
    catatan: s.catatan || null
  }))

  return res.json({
    bulan: prefix,
    kehadiran: Object.values(kehadiranMap),
    sikap: sikapList
  })
}
