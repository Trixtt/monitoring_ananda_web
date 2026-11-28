import { Op } from 'sequelize'
import { Siswa, Nilai, Kehadiran, Sikap, TahunAjaran } from '../models/index.js'
import { hitungNilaiSikap } from '../config/sikap.js'
import { hitungSkorSiswa, mapelTerlemah, rekomendasiUntuk, rentangSemester } from '../services/spk.js'
import { susunRapor } from '../services/rapor.js'

function catatanSikapPublic(s) {
  return {
    id: s.id,
    tanggal: s.tanggal,
    kategori: s.kategori,
    aspek: s.jenis,
    keterangan: s.catatan || null
  }
}

function ringkasSikap(list) {
  return {
    nilai: hitungNilaiSikap(list),
    jumlahCatatan: list.length,
    tanpaCatatan: list.length === 0
  }
}

function whereRentang(rentang) {
  if (!rentang) return {}
  const tanggal = {}
  if (rentang.mulai) tanggal[Op.gte] = rentang.mulai
  if (rentang.akhir) tanggal[Op.lte] = rentang.akhir
  return Reflect.ownKeys(tanggal).length ? { tanggal } : {}
}

function tanggalDalam(rentang, kondisi = {}) {
  return { ...kondisi, ...(whereRentang(rentang).tanggal || {}) }
}

function bulanAwal(rentang) {
  return rentang?.mulai ? String(rentang.mulai).slice(0, 7) : new Date().toISOString().slice(0, 7)
}

export async function ortuDashboard(req, res) {
  const siswa = req.user.siswaId
    ? await Siswa.findByPk(req.user.siswaId, { include: [{ association: 'kelas' }] })
    : null

  if (!siswa) {
    return res.status(404).json({ message: 'Data siswa belum tertaut ke akun ini. Hubungi admin.' })
  }

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const skor = await hitungSkorSiswa(siswa.id, ta?.id, null, rentang)
  const lemah = await mapelTerlemah(siswa.id, ta?.id, rentang)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  const [nilai, kehadiran, sikap] = await Promise.all([
    Nilai.findAll({
      where: { siswaId: siswa.id, tahunAjaranId: ta?.id, ...whereRentang(rentang) },
      include: [{ association: 'mapel' }],
      order: [['createdAt', 'DESC']],
      limit: 30
    }),
    Kehadiran.findAll({
      where: { siswaId: siswa.id, tahunAjaranId: ta?.id, ...whereRentang(rentang) }
    }),
    Sikap.findAll({
      where: { siswaId: siswa.id, tahunAjaranId: ta?.id, ...whereRentang(rentang) },
      order: [['createdAt', 'DESC']]
    })
  ])

  const ringkas = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  kehadiran.forEach((k) => {
    if (ringkas[k.status] !== undefined) ringkas[k.status]++
  })

  return res.json({
    siswa,
    tahunAjaran: ta?.nama || null,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi,
    nilai,
    kehadiran,
    ringkasKehadiran: ringkas,
    ringkasSikap: ringkasSikap(sikap),
    sikap: sikap.map(catatanSikapPublic)
  })
}

export async function ortuRekapNilai(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)

  const rows = await Nilai.findAll({
    where: { siswaId, tahunAjaranId: ta?.id, ...whereRentang(rentang) },
    include: [{ association: 'mapel' }],
    order: [['createdAt', 'DESC']]
  })

  const perMapel = new Map()
  for (const n of rows) {
    const nama = n.mapel?.nama || 'Tanpa mapel'
    if (!perMapel.has(nama)) perMapel.set(nama, [])
    perMapel.get(nama).push(n)
  }

  const rekap = [...perMapel.entries()]
    .map(([nama, daftar]) => {
      const rata = daftar.reduce((a, b) => a + Number(b.nilai), 0) / daftar.length
      return { mapel: nama, daftar, rata: Math.round(rata * 10) / 10 }
    })
    .sort((a, b) => a.mapel.localeCompare(b.mapel, 'id'))

  return res.json({ rekap })
}

export async function ortuProfil(req, res) {
  const siswa = req.user.siswaId
    ? await Siswa.findByPk(req.user.siswaId, { include: [{ association: 'kelas' }] })
    : null
  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  return res.json({
    siswa,
    tahunAjaran: ta?.nama || null,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentangSemester(ta)
  })
}

export async function ortuKehadiran(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const list = await Kehadiran.findAll({
    where: { siswaId, tahunAjaranId: ta?.id, ...whereRentang(rentang) },
    order: [['tanggal', 'DESC']]
  })

  const ringkas = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  list.forEach((k) => {
    if (ringkas[k.status] !== undefined) ringkas[k.status]++
  })

  return res.json({ ringkas, list, semester: ta?.semesterAktif || 'Ganjil', periode: rentang })
}

export async function ortuSikap(req, res) {
  const siswaId = req.user.siswaId
  if (!siswaId) return res.status(400).json({ message: 'Akun belum tertaut siswa.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const list = await Sikap.findAll({
    where: { siswaId, tahunAjaranId: ta?.id, ...whereRentang(rentang) },
    order: [['tanggal', 'DESC'], ['createdAt', 'DESC']]
  })

  return res.json({
    ringkas: ringkasSikap(list),
    list: list.map(catatanSikapPublic),
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang
  })
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
  const rentang = rentangSemester(ta)

  const bulanBawaan = bulanAwal(rentang)
  let y = Number(bulanBawaan.slice(0, 4))
  let m = Number(bulanBawaan.slice(5, 7)) - 1
  const md = String(req.query.bulan || '').match(/^(\d{4})-(\d{2})$/)
  if (md) {
    y = Number(md[1])
    m = Number(md[2]) - 1
  }
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
  const firstDate = `${prefix}-01`
  const lastDate = `${prefix}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`
  const base = {
    tahunAjaranId: ta?.id,
    tanggal: tanggalDalam(rentang, { [Op.between]: [firstDate, lastDate] })
  }

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

  // Satu tanggal dapat memiliki beberapa catatan; semuanya dikirim.
  const sikapMap = {}
  sikap.forEach((s) => {
    const key = s.tanggal
    if (!sikapMap[key]) sikapMap[key] = { tanggal: key, daftar: [] }
    sikapMap[key].daftar.push(catatanSikapPublic(s))
  })
  const sikapList = Object.values(sikapMap)

  return res.json({
    bulan: prefix,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang,
    kehadiran: Object.values(kehadiranMap),
    sikap: sikapList
  })
}
