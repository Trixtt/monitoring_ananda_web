import { Siswa, Nilai, Kehadiran, Sikap, Mapel, TahunAjaran } from '../models/index.js'
import { hitungSkorSiswa, mapelTerlemah, rekomendasiUntuk } from './spk.js'

export async function susunRapor({ siswaId, tahunAjaranId }) {
  const siswa = await Siswa.findByPk(siswaId, { include: [{ association: 'kelas' }] })
  if (!siswa) return null

  const ta = tahunAjaranId
    ? await TahunAjaran.findByPk(tahunAjaranId)
    : (await TahunAjaran.findOne({ where: { isActive: true } })) || null

  const [nilaiRows, kehadiranRows, sikapRows] = await Promise.all([
    Nilai.findAll({
      where: { siswaId, tahunAjaranId: ta?.id },
      include: [{ association: 'mapel' }],
      order: [['createdAt', 'DESC']]
    }),
    Kehadiran.findAll({ where: { siswaId, tahunAjaranId: ta?.id } }),
    Sikap.findAll({ where: { siswaId, tahunAjaranId: ta?.id } })
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
  const persenHadir = totalHari ? Math.round((ringkasKehadiran.hadir / totalHari) * 1000) / 10 : null

  const agregatSikap = { spiritual: { jumlah: 0, total: 0 }, sosial: { jumlah: 0, total: 0 } }
  sikapRows.forEach((s) => {
    if (agregatSikap[s.jenis]) {
      agregatSikap[s.jenis].jumlah++
      agregatSikap[s.jenis].total += Number(s.nilai)
    }
  })
  const ringkasSikap = Object.entries(agregatSikap).map(([jenis, v]) => ({
    jenis,
    jumlah: v.jumlah,
    rata: v.jumlah ? Math.round((v.total / v.jumlah) * 10) / 10 : null
  }))

  const skor = await hitungSkorSiswa(siswa.id, ta?.id)
  const lemah = await mapelTerlemah(siswa.id, ta?.id)
  const rekomendasi = rekomendasiUntuk(skor, lemah?.nama)

  return {
    siswa,
    tahunAjaran: ta?.nama || null,
    tanggalRapor: new Date().toISOString().slice(0, 10),
    rekapNilai,
    ringkasKehadiran,
    totalHari,
    persenHadir,
    ringkasSikap,
    skor,
    mapelTerlemah: lemah?.nama || null,
    rekomendasi
  }
}
