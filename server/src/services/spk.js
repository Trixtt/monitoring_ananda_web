import { Nilai, Kehadiran, Sikap, SettingSpk, Siswa } from '../models/index.js'
import { Op } from 'sequelize'

// Bobot hasil keputusan: Akademik 4, Kehadiran 4, Sikap 5 dari total 13.
// Nilai presisi dipakai di perhitungan; pembulatan hanya untuk tampilan.
export const BOBOT_SAW = Object.freeze({
  bobotAkademik: 4 / 13,
  bobotKehadiran: 4 / 13,
  bobotSikap: 5 / 13
})

const STATUS_EFEKTIF = new Set(['hadir', 'izin', 'sakit'])
const KATEGORI_BELUM_LENGKAP = { kode: 'data_belum_lengkap', label: 'Data Belum Lengkap' }

function whereTanggal(rentang) {
  const cond = {}
  if (rentang?.mulai) cond.tanggal = { ...(cond.tanggal || {}), [Op.gte]: rentang.mulai }
  if (rentang?.akhir) cond.tanggal = { ...(cond.tanggal || {}), [Op.lte]: rentang.akhir }
  return cond
}

export function normalizeSikap(rataSikap) {
  // Skala 1-5, arah benefit: 1 = Kurang -> 0, 5 = Sangat Baik -> 1.
  const hasil = (Number(rataSikap) - 1) / 4
  return Math.min(1, Math.max(0, hasil))
}

export function kategoriDariSkor(skor, setting) {
  const baik = Number(setting.intervalBaikBawah ?? 0.67)
  const perhatian = Number(setting.intervalPerhatianBawah ?? 0.34)
  const berisiko = Number(setting.intervalBerisikoBawah ?? 0)

  // Interval diperiksa berurutan. Batas berisiko dipakai eksplisit agar
  // konfigurasi tidak bisa "mati" silently saat diubah admin.
  if (skor >= baik) return { kode: 'aman', label: 'Baik / Aman' }
  if (skor >= perhatian) return { kode: 'perhatian', label: 'Perlu Perhatian' }
  if (skor >= berisiko) return { kode: 'berisiko', label: 'Berisiko / Butuh Tindak Lanjut' }
  return { kode: 'berisiko', label: 'Berisiko / Butuh Tindak Lanjut' }
}

export function hasilAbk(siswaId = null) {
  return {
    siswaId,
    abk: true,
    lengkap: false,
    skor: null,
    skorAkademik: null,
    skorKehadiran: null,
    skorSikap: null,
    kategori: { kode: 'abk', label: 'Anak Berkebutuhan Khusus' },
    detail: { alasan: 'ABK dikecualikan dari perhitungan SAW otomatis.' }
  }
}

function hasilBelumLengkap(siswaId, kelengkapan, detail = {}) {
  return {
    siswaId,
    abk: false,
    lengkap: false,
    skor: null,
    skorAkademik: null,
    skorKehadiran: null,
    skorSikap: null,
    kategori: KATEGORI_BELUM_LENGKAP,
    kelengkapan,
    detail: {
      rataNilai: detail.rataNilai ?? null,
      totalHari: detail.totalHari ?? null,
      hariTercatat: detail.hariTercatat ?? null,
      jumlahHadirEfektif: detail.jumlahHadirEfektif ?? null,
      jumlahAlpa: detail.jumlahAlpa ?? null,
      rataSikap: detail.rataSikap ?? null
    }
  }
}

/**
 * Menghitung skor SAW dari data yang sudah diagregasi.
 *
 * totalHariSekolah: jumlah hari sekolah yang wajib dicatat pada periode.
 *   Bila tidak diberikan, kelengkapan kehadiran tidak dapat diverifikasi.
 * sikapAngka: nilai kejadian sikap (1-5). Tanpa kejadian = belum lengkap,
 *   karena kebijakan "tanpa kejadian = sangat baik" belum disetujui sekolah.
 */
export function hitungSkorData(
  { nilaiAngka = [], hadirStatus = [], sikapAngka = [], totalHariSekolah = null },
  setting = {}
) {
  const rataNilai = nilaiAngka.length
    ? nilaiAngka.reduce((a, b) => a + Number(b), 0) / nilaiAngka.length
    : null
  const skorAkademik = rataNilai === null ? null : rataNilai / 100

  const totalHariTercatat = hadirStatus.length
  const jumlahHadirEfektif = hadirStatus.filter((st) => STATUS_EFEKTIF.has(st)).length
  const jumlahAlpa = hadirStatus.filter((st) => st === 'alpa').length
  const skorKehadiran = totalHariTercatat
    ? jumlahHadirEfektif / totalHariTercatat
    : null

  const rataSikap = sikapAngka.length
    ? sikapAngka.reduce((a, b) => a + Number(b), 0) / sikapAngka.length
    : null
  const skorSikap = rataSikap === null ? null : normalizeSikap(rataSikap)

  const kelengkapan = {
    akademik: nilaiAngka.length > 0,
    kehadiran: Number(totalHariSekolah) > 0 && totalHariTercatat >= Number(totalHariSekolah),
    sikap: sikapAngka.length > 0
  }
  const detail = {
    rataNilai: rataNilai === null ? null : Number(rataNilai.toFixed(2)),
    totalHari: Number(totalHariSekolah) || 0,
    hariTercatat: totalHariTercatat,
    jumlahHadirEfektif,
    jumlahAlpa,
    rataSikap: rataSikap === null ? null : Number(rataSikap.toFixed(2))
  }

  if (!kelengkapan.akademik || !kelengkapan.kehadiran || !kelengkapan.sikap) {
    return hasilBelumLengkap(null, kelengkapan, detail)
  }

  const wA = Number(setting.bobotAkademik ?? BOBOT_SAW.bobotAkademik)
  const wK = Number(setting.bobotKehadiran ?? BOBOT_SAW.bobotKehadiran)
  const wS = Number(setting.bobotSikap ?? BOBOT_SAW.bobotSikap)
  const skor = skorAkademik * wA + skorKehadiran * wK + skorSikap * wS

  return {
    siswaId: null,
    abk: false,
    lengkap: true,
    skor: Number(skor.toFixed(4)),
    skorAkademik: Number(skorAkademik.toFixed(4)),
    skorKehadiran: Number(skorKehadiran.toFixed(4)),
    skorSikap: Number(skorSikap.toFixed(4)),
    kategori: kategoriDariSkor(skor, setting),
    kelengkapan,
    detail
  }
}

export function agregasiMapel(nilaiRows = []) {
  if (!nilaiRows.length) return null
  const perMapel = {}
  for (const r of nilaiRows) {
    const nama = r.mapel?.nama || 'Tanpa mapel'
    if (!perMapel[nama]) perMapel[nama] = []
    perMapel[nama].push(Number(r.nilai))
  }
  const avgs = Object.entries(perMapel).map(([nama, vals]) => ({
    nama,
    rata: vals.reduce((a, b) => a + b, 0) / vals.length
  }))
  avgs.sort((a, b) => a.rata - b.rata)
  return avgs[0]
}

async function jumlahHariSekolah(tahunAjaranId, rentang) {
  const where = { ...whereTanggal(rentang) }
  if (tahunAjaranId != null) where.tahunAjaranId = tahunAjaranId
  const rows = await Kehadiran.findAll({ where, attributes: ['tanggal'], raw: true })
  // Hari sekolah diperkirakan dari tanggal yang benar-benar tercatat di
  // tahun ajaran/periode berjalan (belum ada kalender hari sekolah eksplisit).
  return new Set(rows.map((r) => String(r.tanggal).slice(0, 10))).size
}

export async function hitungSkorSiswa(siswaId, tahunAjaranId, setting = null, rentang = null) {
  const s = setting || (await SettingSpk.findOne()) || BOBOT_SAW
  const siswa = await Siswa.findByPk(siswaId)
  if (!siswa) throw new Error('Siswa tidak ditemukan.')

  if (siswa.statusABK) return hasilAbk(siswaId)

  const whereTA = { siswaId, ...whereTanggal(rentang) }
  if (tahunAjaranId != null) whereTA.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows, totalHari] = await Promise.all([
    Nilai.findAll({ where: whereTA }),
    Kehadiran.findAll({ where: whereTA }),
    Sikap.findAll({ where: whereTA }),
    jumlahHariSekolah(tahunAjaranId, rentang)
  ])

  const hasil = hitungSkorData(
    {
      nilaiAngka: nilaiRows.map((n) => Number(n.nilai)),
      hadirStatus: hadirRows.map((k) => k.status),
      sikapAngka: sikapRows.map((x) => Number(x.nilai)),
      totalHariSekolah: totalHari
    },
    s
  )
  return { ...hasil, siswaId }
}

export function rekomendasiUntuk(hasil, mapelTerlemah = null) {
  if (hasil?.abk) {
    return {
      tipe: 'abk',
      pesan: 'Dikecualikan dari skoring otomatis SPK. Gunakan pendekatan pembelajaran khusus sesuai catatan ABK siswa.',
      daftar: ['Dikecualikan dari klasifikasi otomatis', 'Terapkan pendekatan pembelajaran sesuai kebutuhan khusus']
    }
  }

  if (hasil?.lengkap === false || hasil?.skor == null || hasil?.kategori?.kode === 'data_belum_lengkap') {
    return {
      tipe: 'data_belum_lengkap',
      pesan: 'Lengkapi data pada periode penilaian sebelum hasil SAW ditampilkan.',
      daftar: [
        'Lengkapi nilai akademik, rekap kehadiran, dan catatan kejadian sikap pada periode ini',
        'Jangan klasifikasikan sebagai berisiko hanya karena data belum tersedia',
        'Tampilkan rekomendasi setelah seluruh kriteria terpenuhi'
      ]
    }
  }

  const { skorAkademik, skorKehadiran, skorSikap } = hasil
  const akademikRendah = Number(skorAkademik) < 0.65
  const sikapRendah = Number(skorSikap) < 0.65
  const kehadiranRendah = Number(skorKehadiran) < 0.8

  const daftar = []
  if (akademikRendah) {
    daftar.push('Berikan les atau bimbingan tambahan')
    if (mapelTerlemah) daftar.push(`Fokus pada mata pelajaran terlemah: ${mapelTerlemah}`)
  }
  if (kehadiranRendah) {
    daftar.push('Investigasi penyebab ketidakhadiran siswa')
    daftar.push('Lakukan coaching / komunikasi dengan orang tua')
  }
  if (sikapRendah) {
    daftar.push('Lakukan pendekatan personal / coaching kepada siswa dan orang tua')
    daftar.push('Bina karakter melalui kegiatan kelas dan pembiasaan positif')
  }

  if (!daftar.length) {
    return {
      tipe: 'baik',
      pesan: 'Perkembangan siswa dalam kondisi baik, pertahankan',
      daftar: ['Perkembangan siswa dalam kondisi baik, pertahankan']
    }
  }

  const jumlahRendah = [akademikRendah, kehadiranRendah, sikapRendah].filter(Boolean).length
  return {
    tipe: jumlahRendah > 1 ? 'gabungan' : akademikRendah ? 'akademik' : kehadiranRendah ? 'kehadiran' : 'sikap',
    pesan: daftar[0],
    daftar
  }
}

export async function rekapKelas(kelasId, tahunAjaranId) {
  const siswaList = await Siswa.findAll({ where: { kelasId }, order: [['nomorAbsen', 'ASC']] })
  const hasilList = await hitungSemuaSiswa(siswaList, tahunAjaranId)

  const ringkas = { aman: 0, perhatian: 0, berisiko: 0, abk: 0, data_belum_lengkap: 0, total: hasilList.length }
  for (const { hasil } of hasilList) {
    if (hasil.kategori.kode in ringkas) ringkas[hasil.kategori.kode]++
  }

  return { hasilList, ringkas }
}

export async function mapelTerlemah(siswaId, tahunAjaranId, rentang = null) {
  const rows = await Nilai.findAll({
    where: { siswaId, tahunAjaranId, ...whereTanggal(rentang) },
    include: [{ association: 'mapel' }]
  })
  return agregasiMapel(rows)
}

export async function hitungSemuaSiswa(siswaList, tahunAjaranId, rentang = null) {
  if (!siswaList.length) return []

  const s = (await SettingSpk.findOne()) || BOBOT_SAW
  const ids = siswaList.map((x) => x.id)
  const baseWhere = { siswaId: { [Op.in]: ids }, ...whereTanggal(rentang) }
  if (tahunAjaranId != null) baseWhere.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows, totalHari] = await Promise.all([
    Nilai.findAll({ where: baseWhere, include: [{ association: 'mapel' }] }),
    Kehadiran.findAll({ where: baseWhere }),
    Sikap.findAll({ where: baseWhere }),
    jumlahHariSekolah(tahunAjaranId, rentang)
  ])

  const kelompokkan = (rows) => {
    const map = new Map()
    for (const r of rows) {
      if (!map.has(r.siswaId)) map.set(r.siswaId, [])
      map.get(r.siswaId).push(r)
    }
    return map
  }
  const gNilai = kelompokkan(nilaiRows)
  const gHadir = kelompokkan(hadirRows)
  const gSikap = kelompokkan(sikapRows)

  return siswaList.map((siswa) => {
    if (siswa.statusABK) {
      return { siswa, hasil: hasilAbk(siswa.id), mapelTerlemah: null }
    }
    const nRows = gNilai.get(siswa.id) || []
    const hasil = {
      ...hitungSkorData(
        {
          nilaiAngka: nRows.map((n) => Number(n.nilai)),
          hadirStatus: (gHadir.get(siswa.id) || []).map((k) => k.status),
          sikapAngka: (gSikap.get(siswa.id) || []).map((x) => Number(x.nilai)),
          totalHariSekolah: totalHari
        },
        s
      ),
      siswaId: siswa.id
    }
    const lemah = agregasiMapel(nRows)
    return { siswa, hasil, mapelTerlemah: lemah }
  })
}
