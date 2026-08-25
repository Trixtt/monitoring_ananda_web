import { Nilai, Kehadiran, Sikap, Siswa, Mapel, TahunAjaran, User } from '../models/index.js'
import { rekapKelas, hitungSkorSiswa, mapelTerlemah, rekomendasiUntuk } from '../services/spk.js'
import { kirimNotifikasiInApp } from '../services/notification.js'
import { kirimWhatsApp, formatPesanNilai } from '../services/fonnte.js'
import { env } from '../config/env.js'

async function tahunAktif() {
  return (await TahunAjaran.findOne({ where: { isActive: true } })) || null
}

function kelasAktif(req) {
  if (req.user.role === 'admin') {
    return Number(req.params.kelasId || req.body.kelasId || req.query.kelasId || 0)
  }
  return req.user.kelasId
}

function kelasDariUser(user) {
  return user.kelasId
}

export async function guruDashboard(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })

  const ta = await tahunAktif()
  const { hasilList, ringkas } = await rekapKelas(kelasId, ta?.id)

  const detail = await Promise.all(
    hasilList.map(async ({ siswa, hasil }) => {
      const lemah = await mapelTerlemah(siswa.id, ta?.id)
      const rekomendasi = rekomendasiUntuk(hasil, lemah?.nama)
      return { siswa, hasil, mapelTerlemah: lemah?.nama || null, rekomendasi }
    })
  )

  return res.json({ ringkas, list: detail, kelasId, tahunAjaran: ta?.nama })
}

export async function guruSiswa(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })
  const ta = await tahunAktif()

  const list = await Siswa.findAll({
    where: { kelasId },
    order: [['nomorAbsen', 'ASC']]
  })

  const hasil = await Promise.all(
    list.map(async (siswa) => {
      const skor = await hitungSkorSiswa(siswa.id, ta?.id)
      return { siswa, skor }
    })
  )

  return res.json({ list: hasil })
}

export async function guruSiswaDetail(req, res) {
  const kelasId = kelasAktif(req)
  const ta = await tahunAktif()
  const siswa = await Siswa.findByPk(req.params.id, { include: [{ association: 'kelas' }] })
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' })
  if (kelasId && siswa.kelasId !== Number(kelasId)) {
    return res.status(403).json({ message: 'Siswa di luar kelas Anda.' })
  }

  const skor = await hitungSkorSiswa(siswa.id, ta?.id)
  const lemah = await mapelTerlemah(siswa.id, ta?.id)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  const nilai = await Nilai.findAll({
    where: { siswaId: siswa.id, tahunAjaranId: ta?.id },
    include: [{ association: 'mapel' }],
    order: [['createdAt', 'DESC']]
  })
  const kehadiran = await Kehadiran.findAll({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id } })
  const sikap = await Sikap.findAll({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id } })

  return res.json({ siswa, skor, rekomendasi, nilai, kehadiran, sikap })
}

export async function guruNilaiUnggah(req, res) {
  const { siswaId, mapelId, judul, nilai } = req.body
  if (!siswaId || !mapelId || !judul || nilai === undefined || nilai === '') {
    return res.status(400).json({ message: 'Siswa, mata pelajaran, judul, dan nilai wajib diisi.' })
  }
  if (Number(nilai) < 0 || Number(nilai) > 100) {
    return res.status(400).json({ message: 'Nilai harus antara 0 sampai 100.' })
  }

  const ta = await tahunAktif()
  const item = await Nilai.create({
    siswaId,
    mapelId,
    judul: String(judul).trim(),
    nilai: Number(nilai),
    filePath: req.file ? `/uploads/${req.file.filename}` : null,
    tanggal: req.body.tanggal || new Date().toISOString().slice(0, 10),
    tahunAjaranId: ta?.id || null
  })

  // Notifikasi ganda ke orang tua
  const mapel = await Mapel.findByPk(mapelId)
  const siswa = await Siswa.findByPk(siswaId)
  const ortu = siswa ? await User.findOne({ where: { siswaId: siswa.id, role: 'orang_tua' } }) : null

  if (ortu) {
    const link = `${env.appDomain}/orangtua`
    await kirimNotifikasiInApp(ortu.id, {
      judul: 'Nilai baru',
      pesan: `Nilai ${item.judul} pada ${mapel?.nama} sudah keluar.`,
      tipe: 'nilai',
      link: `${env.appDomain}/orangtua`
    })
    if (ortu.phone) {
      const pesanWa = formatPesanNilai(siswa.nama, item.judul, mapel?.nama || '', item.nilai, link)
      await kirimWhatsApp(ortu.phone, pesanWa)
    }
  }

  return res.status(201).json({ message: 'Nilai berhasil disimpan dan notifikasi dikirim ke orang tua.', item })
}

export async function guruNilaiPerMapel(req, res) {
  const { mapelId, kelasId } = req.query
  const kId = Number(kelasId || kelasAktif(req))
  const ta = await tahunAktif()

  const list = await Siswa.findAll({ where: { kelasId: kId }, order: [['nomorAbsen', 'ASC']] })
  const rows = []
  for (const s of list) {
    const nilai = await Nilai.findAll({
      where: { siswaId: s.id, mapelId: Number(mapelId), tahunAjaranId: ta?.id },
      include: [{ association: 'mapel' }]
    })
    rows.push({ siswa: s, nilai })
  }
  return res.json({ list: rows })
}

export async function guruKehadiranBulk(req, res) {
  const { tanggal, daftar } = req.body
  if (!tanggal || !Array.isArray(daftar)) {
    return res.status(400).json({ message: 'Tanggal dan daftar kehadiran wajib diisi.' })
  }
  const ta = await tahunAktif()
  const valid = ['hadir', 'izin', 'sakit', 'alpa']

  let tersimpan = 0
  for (const item of daftar) {
    if (!item.siswaId || !valid.includes(item.status)) continue
    const [row] = await Kehadiran.findOrCreate({
      where: { siswaId: item.siswaId, tanggal },
      defaults: {
        status: item.status,
        keterangan: item.keterangan || null,
        tahunAjaranId: ta?.id || null
      }
    })
    if (row.status !== item.status) {
      row.status = item.status
      row.keterangan = item.keterangan || null
      await row.save()
    }
    tersimpan++
  }

  return res.json({ message: `${tersimpan} catatan kehadiran disimpan.` })
}

export async function guruKehadiranByDate(req, res) {
  const { tanggal, kelasId } = req.query
  const kId = Number(kelasId || kelasAktif(req))

  const list = await Siswa.findAll({ where: { kelasId: kId }, order: [['nomorAbsen', 'ASC']] })
  const rows = []
  for (const s of list) {
    const k = tanggal
      ? await Kehadiran.findOne({ where: { siswaId: s.id, tanggal } })
      : null
    rows.push({ siswa: s, kehadiran: k })
  }
  return res.json({ list: rows })
}

export async function guruSikapBulk(req, res) {
  const { daftar } = req.body
  if (!Array.isArray(daftar)) {
    return res.status(400).json({ message: 'Data sikap wajib diisi.' })
  }
  const ta = await tahunAktif()
  const valid = [1, 2, 3, 4]

  let tersimpan = 0
  for (const item of daftar) {
    if (!item.siswaId || !valid.includes(Number(item.nilai))) continue
    await Sikap.create({
      siswaId: item.siswaId,
      jenis: item.jenis === 'sosial' ? 'sosial' : 'spiritual',
      nilai: Number(item.nilai),
      catatan: item.catatan || null,
      tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
      tahunAjaranId: ta?.id || null
    })
    tersimpan++
  }
  return res.json({ message: `${tersimpan} penilaian sikap disimpan.` })
}

export async function guruSikapBySiswa(req, res) {
  const siswaId = req.params.id
  const ta = await tahunAktif()
  const list = await Sikap.findAll({
    where: { siswaId, tahunAjaranId: ta?.id },
    order: [['createdAt', 'DESC']]
  })
  return res.json({ list })
}

export async function daftarNilaiUntukWali(req, res) {
  const kelasId = kelasAktif(req)
  const ta = await tahunAktif()
  const siswaList = await Siswa.findAll({ where: { kelasId } })

  const list = []
  for (const siswa of siswaList) {
    const nilai = await Nilai.findAll({
      where: { siswaId: siswa.id, tahunAjaranId: ta?.id },
      include: [{ association: 'mapel' }],
      order: [['createdAt', 'DESC']]
    })
    list.push({ siswa, nilai })
  }
  return res.json({ list })
}

export async function mapelList(req, res) {
  const list = await Mapel.findAll({ order: [['nama', 'ASC']] })
  return res.json({ list })
}

export async function guruMonitoring(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })

  const ta = await tahunAktif()
  const list = await Siswa.findAll({ where: { kelasId }, order: [['nomorAbsen', 'ASC']] })

  const rows = []
  for (const siswa of list) {
    const skor = await hitungSkorSiswa(siswa.id, ta?.id)
    const kehadiran = await Kehadiran.findAll({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id } })
    const jumlahNilai = await Nilai.count({ where: { siswaId: siswa.id, tahunAjaranId: ta?.id } })
    const lemah = await mapelTerlemah(siswa.id, ta?.id)
    const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

    const ringkasKehadiran = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    kehadiran.forEach((k) => {
      if (k.status in ringkasKehadiran) ringkasKehadiran[k.status]++
    })

    rows.push({
      siswa,
      skor,
      kehadiran: { ...ringkasKehadiran, total: kehadiran.length },
      jumlahNilai,
      mapelTerlemah: lemah?.nama || null,
      rekomendasi
    })
  }

  return res.json({ list: rows, tahunAjaran: ta?.nama || null, kelasId })
}

export { kelasDariUser }
