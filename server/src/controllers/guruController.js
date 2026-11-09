import { Nilai, Kehadiran, Sikap, Siswa, Mapel, TahunAjaran, User, sequelize } from '../models/index.js'
import { Op, fn, col } from 'sequelize'
import { rekapKelas, hitungSkorSiswa, hitungSemuaSiswa, mapelTerlemah, rekomendasiUntuk } from '../services/spk.js'
import { kirimNotifikasiInApp } from '../services/notification.js'
import { kirimWhatsApp, formatPesanNilai } from '../services/fonnte.js'
import { cariSiswaTerakses, validasiSiswaDalamKelas } from '../services/aksesKelas.js'
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

const LABEL_KEHADIRAN = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' }

function tanggalIndo(value) {
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function petaNamaSiswa(siswaIds) {
  const unik = [...new Set(siswaIds.map(Number).filter(Boolean))]
  if (!unik.length) return new Map()
  const rows = await Siswa.findAll({ where: { id: { [Op.in]: unik } }, attributes: ['id', 'nama'] })
  return new Map(rows.map((s) => [Number(s.id), s.nama]))
}

async function petaOrangTua(siswaIds) {
  const unik = [...new Set(siswaIds.map(Number).filter(Boolean))]
  if (!unik.length) return new Map()
  const rows = await User.findAll({
    where: { siswaId: { [Op.in]: unik }, role: 'orang_tua' },
    attributes: ['id', 'siswaId']
  })
  return new Map(rows.map((u) => [Number(u.siswaId), u]))
}

export async function guruDashboard(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })

  const ta = await tahunAktif()
  const { hasilList, ringkas } = await rekapKelas(kelasId, ta?.id)

  const detail = hasilList.map(({ siswa, hasil, mapelTerlemah: lemah }) => ({
    siswa,
    hasil,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi: rekomendasiUntuk(hasil, lemah?.nama)
  }))

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

  const hasil = (await hitungSemuaSiswa(list, ta?.id)).map(({ siswa, hasil: skor, mapelTerlemah: lemah }) => ({
    siswa,
    skor,
    mapelTerlemah: lemah?.nama || null
  }))

  return res.json({ list: hasil })
}

export async function guruSiswaDetail(req, res) {
  const ta = await tahunAktif()
  const hasil = await cariSiswaTerakses(req.user, req.params.id, { include: [{ association: 'kelas' }] })
  if (!hasil.siswa) return res.status(hasil.status).json({ message: hasil.message })
  const siswa = hasil.siswa

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

  const hasil = await cariSiswaTerakses(req.user, siswaId)
  if (!hasil.siswa) return res.status(hasil.status).json({ message: hasil.message })
  const siswa = hasil.siswa

  const ta = await tahunAktif()
  const item = await Nilai.create({
    siswaId: siswa.id,
    mapelId,
    judul: String(judul).trim(),
    nilai: Number(nilai),
    tanggal: req.body.tanggal || new Date().toISOString().slice(0, 10),
    tahunAjaranId: ta?.id || null
  })

  const mapel = await Mapel.findByPk(mapelId)
  const ortu = await User.findOne({ where: { siswaId: siswa.id, role: 'orang_tua' } })

  if (ortu) {
    const link = `${env.appDomain}/orangtua/nilai`
    await kirimNotifikasiInApp(ortu.id, {
      judul: 'Nilai baru',
      pesan: `Nilai ${item.judul} pada ${mapel?.nama} sudah keluar.`,
      tipe: 'nilai',
      link
    })
    if (ortu.phone) {
      const pesanWa = formatPesanNilai(siswa.nama, item.judul, mapel?.nama || '', item.nilai, link)
      await kirimWhatsApp(ortu.phone, pesanWa)
    }
  }

  return res.status(201).json({ message: 'Nilai berhasil disimpan dan notifikasi dikirim ke orang tua.', item })
}

export async function guruNilaiPerMapel(req, res) {
  const { mapelId } = req.query
  const kId = kelasAktif(req)
  if (!kId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })
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

  const akses = await validasiSiswaDalamKelas(req.user, daftar.map((item) => item.siswaId))
  if (akses.status) return res.status(akses.status).json({ message: akses.message })

  let tersimpan = 0
  const perubahan = []
  await sequelize.transaction(async (t) => {
    for (const item of daftar) {
      if (!item.siswaId || !valid.includes(item.status)) continue
      const [row, dibuat] = await Kehadiran.findOrCreate({
        where: { siswaId: item.siswaId, tanggal },
        defaults: {
          status: item.status,
          keterangan: item.keterangan || null,
          tahunAjaranId: ta?.id || null
        },
        transaction: t
      })
      const statusLama = dibuat ? null : row.status
      if (row.status !== item.status) {
        row.status = item.status
        row.keterangan = item.keterangan || null
        await row.save({ transaction: t })
      }
      if (item.status !== 'hadir' && statusLama !== item.status) {
        perubahan.push({
          siswaId: Number(item.siswaId),
          status: item.status,
          keterangan: String(item.keterangan || '').trim() || null,
          tanggal
        })
      }
      tersimpan++
    }
  })

  if (perubahan.length) {
    try {
      const ids = perubahan.map((item) => item.siswaId)
      const [namaMap, ortuMap] = await Promise.all([petaNamaSiswa(ids), petaOrangTua(ids)])
      await Promise.allSettled(
        perubahan.map((item) => {
          const ortu = ortuMap.get(item.siswaId)
          if (!ortu) return null
          const nama = namaMap.get(item.siswaId) || 'Ananda'
          const keterangan = item.keterangan ? ` Catatan: ${item.keterangan}.` : ''
          return kirimNotifikasiInApp(ortu.id, {
            judul: 'Perubahan kehadiran',
            pesan: `${nama} tercatat ${LABEL_KEHADIRAN[item.status]} pada ${tanggalIndo(item.tanggal)}.${keterangan}`,
            tipe: 'kehadiran',
            link: `${env.appDomain}/orangtua/monitoring`
          })
        })
      )
    } catch (e) {
      console.error('[Notifikasi] Gagal mengirim notifikasi kehadiran:', e.message)
    }
  }

  return res.json({ message: `${tersimpan} catatan kehadiran disimpan.` })
}

export async function guruKehadiranByDate(req, res) {
  const { tanggal } = req.query
  const kId = kelasAktif(req)
  if (!kId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })

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

  const akses = await validasiSiswaDalamKelas(req.user, daftar.map((item) => item.siswaId))
  if (akses.status) return res.status(akses.status).json({ message: akses.message })

  let tersimpan = 0
  const perluNotifikasi = []
  await sequelize.transaction(async (t) => {
    for (const item of daftar) {
      if (!item.siswaId || !valid.includes(Number(item.nilai))) continue
      const jenis = item.jenis === 'sosial' ? 'sosial' : 'spiritual'
      const nilai = Number(item.nilai)
      const catatan = String(item.catatan || '').trim()
      const tanggalSikap = item.tanggal || new Date().toISOString().slice(0, 10)
      await Sikap.create({
        siswaId: item.siswaId,
        jenis,
        nilai,
        catatan: catatan || null,
        tanggal: tanggalSikap,
        tahunAjaranId: ta?.id || null
      }, { transaction: t })
      if (nilai <= 2 || catatan) {
        perluNotifikasi.push({
          siswaId: Number(item.siswaId),
          jenis,
          nilai,
          catatan,
          tanggal: tanggalSikap
        })
      }
      tersimpan++
    }
  })

  if (perluNotifikasi.length) {
    try {
      const ids = perluNotifikasi.map((item) => item.siswaId)
      const [namaMap, ortuMap] = await Promise.all([petaNamaSiswa(ids), petaOrangTua(ids)])
      await Promise.allSettled(
        perluNotifikasi.map((item) => {
          const ortu = ortuMap.get(item.siswaId)
          if (!ortu) return null
          const nama = namaMap.get(item.siswaId) || 'Ananda'
          const catatan = item.catatan ? ` Catatan: ${item.catatan}.` : ''
          return kirimNotifikasiInApp(ortu.id, {
            judul: 'Catatan sikap',
            pesan: `${nama}: sikap ${item.jenis} bernilai ${item.nilai} pada ${tanggalIndo(item.tanggal)}.${catatan}`,
            tipe: 'sikap',
            link: `${env.appDomain}/orangtua/rekap`
          })
        })
      )
    } catch (e) {
      console.error('[Notifikasi] Gagal mengirim notifikasi sikap:', e.message)
    }
  }

  return res.json({ message: `${tersimpan} penilaian sikap disimpan.` })
}

export async function guruSikapBySiswa(req, res) {
  const hasil = await cariSiswaTerakses(req.user, req.params.siswaId, { attributes: ['id', 'kelasId'] })
  if (!hasil.siswa) return res.status(hasil.status).json({ message: hasil.message })

  const ta = await tahunAktif()
  const list = await Sikap.findAll({
    where: { siswaId: hasil.siswa.id, tahunAjaranId: ta?.id },
    order: [['createdAt', 'DESC']]
  })
  return res.json({ list })
}

export async function daftarNilaiUntukWali(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })
  const ta = await tahunAktif()
  const siswaList = await Siswa.findAll({ where: { kelasId }, order: [['nomorAbsen', 'ASC']] })
  const ids = siswaList.map((s) => s.id)

  const nilaiRows = ids.length
    ? await Nilai.findAll({
        where: { siswaId: { [Op.in]: ids }, tahunAjaranId: ta?.id },
        include: [{ association: 'mapel' }],
        order: [['createdAt', 'DESC']]
      })
    : []

  const peta = new Map()
  for (const n of nilaiRows) {
    if (!peta.has(n.siswaId)) peta.set(n.siswaId, [])
    peta.get(n.siswaId).push(n)
  }

  const list = siswaList.map((siswa) => ({ siswa, nilai: peta.get(siswa.id) || [] }))
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
  const ids = list.map((s) => s.id)

  const [hasilSemua, kehadiranRows, nilaiCounts] = await Promise.all([
    hitungSemuaSiswa(list, ta?.id),
    ids.length
      ? Kehadiran.findAll({
          where: { siswaId: { [Op.in]: ids }, tahunAjaranId: ta?.id },
          attributes: ['siswaId', 'status']
        })
      : [],
    ids.length
      ? Nilai.findAll({
          where: { siswaId: { [Op.in]: ids }, tahunAjaranId: ta?.id },
          attributes: ['siswaId', [fn('COUNT', col('id')), 'jumlah']],
          group: ['siswaId'],
          raw: true
        })
      : []
  ])

  const kehadiranMap = new Map()
  for (const k of kehadiranRows) {
    if (!kehadiranMap.has(k.siswaId)) {
      kehadiranMap.set(k.siswaId, { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 })
    }
    const r = kehadiranMap.get(k.siswaId)
    if (k.status in r) r[k.status]++
    r.total++
  }
  const nilaiMap = new Map(nilaiCounts.map((n) => [Number(n.siswaId), Number(n.jumlah)]))

  const rows = hasilSemua.map(({ siswa, hasil: skor, mapelTerlemah: lemah }) => ({
    siswa,
    skor,
    kehadiran: kehadiranMap.get(siswa.id) || { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 },
    jumlahNilai: nilaiMap.get(Number(siswa.id)) || 0,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi: rekomendasiUntuk(skor, lemah?.nama)
  }))

  return res.json({ list: rows, tahunAjaran: ta?.nama || null, kelasId })
}

export async function guruKehadiranKalender(req, res) {
  const kelasId = kelasAktif(req)
  if (!kelasId) return res.status(400).json({ message: 'Kelas belum ditentukan.' })
  const ta = await tahunAktif()

  let y = new Date().getFullYear()
  let m = new Date().getMonth()
  const md = String(req.query.bulan || '').match(/^(\d{4})-(\d{2})$/)
  if (md) {
    y = Number(md[1])
    m = Number(md[2]) - 1
  }
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
  const firstDate = `${prefix}-01`
  const lastDate = `${prefix}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`

  const siswaList = await Siswa.findAll({ where: { kelasId } })
  const rows = await Kehadiran.findAll({
    where: { tahunAjaranId: ta?.id, tanggal: { [Op.between]: [firstDate, lastDate] } },
    include: [{ association: 'siswa', where: { kelasId } }]
  })

  const map = {}
  rows.forEach((k) => {
    if (!map[k.tanggal]) map[k.tanggal] = { tanggal: k.tanggal, hadir: 0, izin: 0, sakit: 0, alpa: 0, daftar: [] }
    map[k.tanggal][k.status]++
    if (k.status !== 'hadir') {
      map[k.tanggal].daftar.push({
        id: k.siswa.id,
        nomorAbsen: k.siswa.nomorAbsen,
        nama: k.siswa.nama,
        status: k.status,
        keterangan: k.keterangan || null
      })
    }
  })

  return res.json({
    bulan: prefix,
    totalSiswa: siswaList.length,
    kehadiran: Object.values(map)
  })
}

export { kelasDariUser }
