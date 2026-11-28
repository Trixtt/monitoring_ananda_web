import { Op } from 'sequelize'
import { Siswa, Nilai, Kehadiran, Sikap, TahunAjaran } from '../models/index.js'
import { hitungNilaiSikap } from '../config/sikap.js'
import { hitungSkorSiswa, mapelTerlemah, rekomendasiUntuk, rentangSemester, labelPeriode } from './spk.js'

function whereTanggal(rentang) {
  if (!rentang) return {}
  const tanggal = {}
  if (rentang.mulai) tanggal[Op.gte] = rentang.mulai
  if (rentang.akhir) tanggal[Op.lte] = rentang.akhir
  return Reflect.ownKeys(tanggal).length ? { tanggal } : {}
}

export async function susunRapor({ siswaId, tahunAjaranId, rentang = null }) {
  const siswa = await Siswa.findByPk(siswaId, { include: [{ association: 'kelas' }] })
  if (!siswa) return null

  const ta = tahunAjaranId
    ? await TahunAjaran.findByPk(tahunAjaranId)
    : (await TahunAjaran.findOne({ where: { isActive: true } })) || null
  const periode = rentang === false
    ? null
    : rentang && (rentang.mulai || rentang.akhir)
      ? rentang
      : rentangSemester(ta)

  const [nilaiRows, kehadiranRows, sikapRows] = await Promise.all([
    Nilai.findAll({
      where: { siswaId, tahunAjaranId: ta?.id, ...whereTanggal(periode) },
      include: [{ association: 'mapel' }],
      order: [['createdAt', 'DESC']]
    }),
    Kehadiran.findAll({ where: { siswaId, tahunAjaranId: ta?.id, ...whereTanggal(periode) } }),
    Sikap.findAll({ where: { siswaId, tahunAjaranId: ta?.id, ...whereTanggal(periode) } })
  ])

  const perMapel = {}
  for (const n of nilaiRows) {
    const nama = n.mapel?.nama || 'Tanpa Mapel'
    perMapel[nama] = perMapel[nama] || []
    perMapel[nama].push(Number(n.nilai))
  }
  const rekapNilai = Object.entries(perMapel)
    .map(([mapel, vals]) => ({
      mapel,
      jumlah: vals.length,
      rata: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    }))
    .sort((a, b) => a.mapel.localeCompare(b.mapel))

  const ringkasKehadiran = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  kehadiranRows.forEach((k) => {
    if (k.status in ringkasKehadiran) ringkasKehadiran[k.status]++
  })
  const totalHari = kehadiranRows.length
  // Hadir, izin, dan sakit adalah kehadiran efektif; hanya alpa yang mengurangi.
  const jumlahEfektif = ringkasKehadiran.hadir + ringkasKehadiran.izin + ringkasKehadiran.sakit
  const persenHadir = totalHari ? Math.round((jumlahEfektif / totalHari) * 1000) / 10 : null

  // Satu kriteria Sikap gabungan: aspek sosial/spiritual hanya informasi
  // pendukung pada catatan, bukan dua nilai terpisah.
  const ringkasSikap = {
    nilai: hitungNilaiSikap(sikapRows),
    jumlahCatatan: sikapRows.length,
    tanpaCatatan: sikapRows.length === 0
  }
  const daftarSikap = sikapRows.map((s) => ({
    tanggal: s.tanggal,
    kategori: s.kategori,
    aspek: s.jenis,
    keterangan: s.catatan || null
  }))

  const skor = await hitungSkorSiswa(siswa.id, ta?.id, null, periode)
  const lemah = await mapelTerlemah(siswa.id, ta?.id, periode)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  return {
    siswa,
    tahunAjaran: ta?.nama || null,
    semester: ta?.semesterAktif || 'Ganjil',
    periode,
    labelPeriode: labelPeriode(ta, rentang && (rentang.mulai || rentang.akhir) ? periode : null),
    tanggalRapor: new Date().toISOString().slice(0, 10),
    rekapNilai,
    ringkasKehadiran,
    totalHari,
    persenHadir,
    ringkasSikap,
    daftarSikap,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi
  }
}
