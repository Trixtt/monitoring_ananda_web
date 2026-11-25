import { Kelas, Siswa, TahunAjaran, Laporan } from '../models/index.js'
import { Op } from 'sequelize'
import {
  hitungSkorSiswa,
  mapelTerlemah,
  rekomendasiUntuk,
  hitungSemuaSiswa,
  rentangSemester,
  labelPeriode
} from '../services/spk.js'
import { susunRapor } from '../services/rapor.js'

export async function kepsekRingkasan(req, res) {
  const taId = req.query.tahunAjaranId ? Number(req.query.tahunAjaranId) : null
  const ta = taId ? await TahunAjaran.findByPk(taId) : (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)

  const kelasList = await Kelas.findAll({ order: [['tingkat', 'ASC'], ['nama', 'ASC']] })
  const siswaWhere = {}
  if (taId) {
    siswaWhere.tahunAjaranId = taId
  } else if (ta) {
    siswaWhere.tahunAjaranId = ta.id
  }
  const siswaList = await Siswa.findAll({
    where: siswaWhere,
    include: [{ association: 'kelas' }],
    order: [['kelasId', 'ASC'], ['nomorAbsen', 'ASC']]
  })
  const hasilSemua = await hitungSemuaSiswa(siswaList, ta?.id ?? null, rentang)

  const ringkasPerKelas = new Map()
  for (const { siswa, hasil } of hasilSemua) {
    if (!ringkasPerKelas.has(siswa.kelasId)) {
      ringkasPerKelas.set(siswa.kelasId, { aman: 0, perhatian: 0, berisiko: 0, data_belum_lengkap: 0, abk: 0, total: 0 })
    }
    const r = ringkasPerKelas.get(siswa.kelasId)
    r.total++
    if (hasil.kategori.kode in r) r[hasil.kategori.kode]++
  }

  const perKelas = []
  const total = { aman: 0, perhatian: 0, berisiko: 0, data_belum_lengkap: 0, abk: 0, siswa: 0 }

  for (const kelas of kelasList) {
    const ringkas = ringkasPerKelas.get(kelas.id) || { aman: 0, perhatian: 0, berisiko: 0, data_belum_lengkap: 0, abk: 0, total: 0 }
    perKelas.push({
      kelas: { id: kelas.id, nama: kelas.nama, tingkat: kelas.tingkat, waliKelas: kelas.waliKelas },
      ...ringkas
    })
    total.aman += ringkas.aman
    total.perhatian += ringkas.perhatian
    total.berisiko += ringkas.berisiko
    total.data_belum_lengkap += ringkas.data_belum_lengkap
    total.abk += ringkas.abk
    total.siswa += ringkas.total
  }

  const semuaTahunAjaran = await TahunAjaran.findAll({ order: [['id', 'DESC']] })

  return res.json({
    perKelas,
    total,
    tahunAjaran: ta?.nama || null,
    tahunAjaranId: ta?.id || null,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang,
    daftarTahunAjaran: semuaTahunAjaran
  })
}

export async function kepsekSiswaDetail(req, res) {
  const siswa = await Siswa.findByPk(req.params.id, { include: [{ association: 'kelas' }] })
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const skor = await hitungSkorSiswa(siswa.id, ta?.id, null, rentang)
  const lemah = await mapelTerlemah(siswa.id, ta?.id, rentang)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  return res.json({
    siswa,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang
  })
}

export async function kepsekSiswaRisiko(req, res) {
  const taId = req.query.tahunAjaranId ? Number(req.query.tahunAjaranId) : null
  const ta = taId ? await TahunAjaran.findByPk(taId) : (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const { kategori = 'berisiko', kelasId } = req.query

  const kelasWhere = kelasId ? { id: kelasId } : {}
  const kelasList = await Kelas.findAll({ where: kelasWhere, order: [['tingkat', 'ASC']] })
  if (!kelasList.length) return res.json({ list: [], kategori })

  const siswaList = await Siswa.findAll({
    where: { kelasId: { [Op.in]: kelasList.map((k) => k.id) } },
    include: [{ association: 'kelas' }],
    order: [['kelasId', 'ASC'], ['nomorAbsen', 'ASC']]
  })

  const hasil = (await hitungSemuaSiswa(siswaList, ta?.id, rentang))
    .filter(({ hasil: skor }) => skor.kategori.kode === kategori)
    .map(({ siswa, hasil: skor, mapelTerlemah: lemah }) => ({
      siswa,
      skor,
      mapelTerlemah: lemah?.nama || null
    }))

  return res.json({ list: hasil, kategori, semester: ta?.semesterAktif || 'Ganjil', periode: rentang })
}

export async function kepsekDetailKelas(req, res) {
  const kelas = await Kelas.findByPk(req.params.kelasId)
  if (!kelas) return res.status(404).json({ message: 'Kelas tidak ditemukan.' })

  const taId = Number(req.query.tahunAjaranId) || null
  const ta = taId ? await TahunAjaran.findByPk(taId) : (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentang = rentangSemester(ta)
  const siswaList = await Siswa.findAll({
    where: { kelasId: kelas.id },
    include: [{ association: 'kelas' }],
    order: [['nomorAbsen', 'ASC']]
  })
  const hasilSemua = await hitungSemuaSiswa(siswaList, ta?.id, rentang)

  const ringkas = { aman: 0, perhatian: 0, berisiko: 0, data_belum_lengkap: 0, abk: 0, total: hasilSemua.length }
  for (const { hasil } of hasilSemua) {
    if (hasil.kategori.kode in ringkas) ringkas[hasil.kategori.kode]++
  }

  const detail = hasilSemua.map(({ siswa, hasil: skor, mapelTerlemah: lemah }) => ({
    siswa,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi: rekomendasiUntuk(skor, lemah?.nama)
  }))

  return res.json({
    kelas,
    ringkas,
    list: detail,
    tahunAjaran: ta?.nama || null,
    semester: ta?.semesterAktif || 'Ganjil',
    periode: rentang
  })
}

function siswaSnapshot(siswa, skor, mapelTerlemah) {
  return {
    siswa: {
      id: siswa.id,
      nisn: siswa.nisn,
      nama: siswa.nama,
      nomorAbsen: siswa.nomorAbsen,
      statusABK: siswa.statusABK,
      kelas: siswa.kelas ? { id: siswa.kelas.id, nama: siswa.kelas.nama } : null
    },
    skor,
    mapelTerlemah
  }
}

export async function kepsekGenerateLaporan(req, res) {
  const { judul, kelasId, kategori, tanggalMulai, tanggalAkhir } = req.body || {}

  const ta = (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const rentangEksplisit = Boolean(tanggalMulai || tanggalAkhir)
  const rentang = rentangEksplisit
    ? { mulai: tanggalMulai || null, akhir: tanggalAkhir || null }
    : rentangSemester(ta)

  const kelasWhere = kelasId ? { id: kelasId } : {}
  const kelasList = await Kelas.findAll({ where: kelasWhere, order: [['tingkat', 'ASC'], ['nama', 'ASC']] })
  if (!kelasList.length) return res.status(400).json({ message: 'Kelas tidak ditemukan.' })

  const urutanKelas = new Map(kelasList.map((k, i) => [k.id, i]))
  const siswaList = await Siswa.findAll({
    where: { kelasId: { [Op.in]: kelasList.map((k) => k.id) } },
    include: ['kelas'],
    order: [['nomorAbsen', 'ASC']]
  })
  siswaList.sort((a, b) => (urutanKelas.get(a.kelasId) - urutanKelas.get(b.kelasId)) || (a.nomorAbsen - b.nomorAbsen))

  const hasilSemua = await hitungSemuaSiswa(siswaList, ta?.id ?? null, rentang)

  const snapshot = []
  for (const { siswa, hasil, mapelTerlemah: lemah } of hasilSemua) {
    if (kategori && hasil.kategori.kode !== kategori) continue
    snapshot.push(siswaSnapshot(siswa, hasil, lemah?.nama || null))
  }

  const labelKelas = kelasList.length === 1 ? kelasList[0].nama : `${kelasList.length} kelas`
  const labelKategori = kategori ? { aman: 'Baik/Aman', perhatian: 'Perlu Perhatian', berisiko: 'Berisiko', abk: 'ABK', data_belum_lengkap: 'Data Belum Lengkap' }[kategori] || kategori : 'Semua Kondisi'
  const labelWaktu = labelPeriode(ta, rentangEksplisit ? rentang : null)
  const judulLaporan =
    judul?.trim() || `Laporan Siswa ${labelKategori} - ${labelKelas} (${labelWaktu})`

  const laporan = await Laporan.create({
    judul: judulLaporan,
    kelasId: kelasId ? Number(kelasId) : null,
    kelasNama: labelKelas,
    kategori: kategori || null,
    tanggalMulai: rentang.mulai || null,
    tanggalAkhir: rentang.akhir || null,
    jumlah: snapshot.length,
    isi: JSON.stringify(snapshot),
    userId: req.user.id
  })

  return res.status(201).json({ laporan, list: snapshot })
}

export async function kepsekRiwayatLaporan(req, res) {
  const list = await Laporan.findAll({
    include: [{ association: 'dibuatOleh', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']]
  })
  return res.json({ list })
}

export async function kepsekDetailLaporan(req, res) {
  const laporan = await Laporan.findByPk(req.params.id, {
    include: [{ association: 'dibuatOleh', attributes: ['id', 'name'] }]
  })
  if (!laporan) return res.status(404).json({ message: 'Laporan tidak ditemukan.' })
  let isi
  try {
    isi = JSON.parse(laporan.isi)
  } catch {
    isi = []
  }
  return res.json({ laporan, list: isi })
}

export async function kepsekHapusLaporan(req, res) {
  const laporan = await Laporan.findByPk(req.params.id)
  if (!laporan) return res.status(404).json({ message: 'Laporan tidak ditemukan.' })
  await laporan.destroy()
  return res.json({ message: 'Laporan berhasil dihapus.' })
}

export async function kepsekRapor(req, res) {
  const rapor = await susunRapor({ siswaId: Number(req.params.siswaId) })
  if (!rapor) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })

  return res.json({ rapor })
}
