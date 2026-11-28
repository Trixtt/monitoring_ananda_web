import { Nilai, Kehadiran, Sikap, SettingSpk, Siswa, TahunAjaran } from '../models/index.js'
import { hitungNilaiSikap, penguranganUntuk } from '../config/sikap.js'
import { Op } from 'sequelize'

// Bobot hasil keputusan: Akademik 4, Kehadiran 4, Sikap 5 dari total 13.
// Nilai presisi dipakai di perhitungan; pembulatan hanya untuk tampilan.
export const BOBOT_SAW = Object.freeze({
  bobotAkademik: 4 / 13,
  bobotKehadiran: 4 / 13,
  bobotSikap: 5 / 13
})

// Ambang rekomendasi disetujui 0,65 / 0,65 / 0,80 dan dapat diubah admin.
// Nilai di bawah ambang memicu rekomendasi untuk kriteria tersebut.
export const AMBANG_REKOMENDASI = Object.freeze({
  ambangAkademik: 0.65,
  ambangSikap: 0.65,
  ambangKehadiran: 0.8
})

// Rulebase per mata pelajaran memakai skala nilai 0-100 (bukan 0-1).
// KKM sekolah 70; ambang unggul 85. Keduanya dapat diatur Admin.
export const AMBANG_MAPEL = Object.freeze({
  kkmMapel: 70,
  ambangUnggul: 85
})

// Rentang Kaldik SD/MI Jawa Tengah 2025/2026. Dipakai sebagai nilai awal
// saat admin belum mengisi rentang pada tahun ajaran.
export const RENTANG_SEMESTER = Object.freeze({
  Ganjil: Object.freeze({ mulai: '2025-07-14', akhir: '2025-12-21' }),
  Genap: Object.freeze({ mulai: '2026-01-05', akhir: '2026-06-21' })
})

const STATUS_EFEKTIF = new Set(['hadir', 'izin', 'sakit'])
const KATEGORI_BELUM_LENGKAP = { kode: 'data_belum_lengkap', label: 'Data Belum Lengkap' }

function whereTanggal(rentang) {
  const cond = {}
  if (rentang?.mulai) cond.tanggal = { ...(cond.tanggal || {}), [Op.gte]: rentang.mulai }
  if (rentang?.akhir) cond.tanggal = { ...(cond.tanggal || {}), [Op.lte]: rentang.akhir }
  return cond
}

export function rentangSemester(ta = null) {
  const semester = ta?.semesterAktif === 'Genap' ? 'Genap' : 'Ganjil'
  const kunci = semester === 'Ganjil' ? 'ganjil' : 'genap'
  const bawaan = RENTANG_SEMESTER[semester]
  const mulai = ta?.[`${kunci}Mulai`] || bawaan.mulai
  const akhir = ta?.[`${kunci}Akhir`] || bawaan.akhir
  return {
    mulai: String(mulai).slice(0, 10),
    akhir: String(akhir).slice(0, 10)
  }
}

export function labelPeriode(ta, rentang = null) {
  if (rentang?.mulai || rentang?.akhir) {
    return `${rentang.mulai || '…'} s/d ${rentang.akhir || '…'}`
  }
  const r = rentangSemester(ta)
  return `Semester ${ta?.semesterAktif || 'Ganjil'} (${r.mulai} s/d ${r.akhir})`
}

async function tentukanRentang(tahunAjaranId, rentang) {
  // false dipakai eksplisit oleh pemanggil yang menghendaki tanpa filter.
  if (rentang === false) return null
  if (rentang && (rentang.mulai || rentang.akhir)) return rentang

  const ta = tahunAjaranId
    ? await TahunAjaran.findByPk(tahunAjaranId)
    : (await TahunAjaran.findOne({ where: { isActive: true } }))
  return rentangSemester(ta)
}

export function normalizeSikap(nilaiSikap) {
  // Nilai sikap 0-100 dari catatan kejadian; semua kriteria SAW bersifat benefit.
  const hasil = Number(nilaiSikap) / 100
  return Math.min(1, Math.max(0, Number.isFinite(hasil) ? hasil : 0))
}

export function totalPenguranganSikap(catatan = []) {
  return (Array.isArray(catatan) ? catatan : []).reduce((jumlah, item) => {
    if (item === null || item === undefined) return jumlah
    const mentah = typeof item === 'object'
      ? (item.pengurangan ?? penguranganUntuk(item.kategori))
      : item
    const nilai = Number(mentah)
    return jumlah + (Number.isFinite(nilai) && nilai > 0 ? nilai : 0)
  }, 0)
}

export function kategoriDariSkor(skor, setting) {
  const baik = Number(setting.intervalBaikBawah ?? 0.67)
  const perhatian = Number(setting.intervalPerhatianBawah ?? 0.34)

  // Klasifikasi tetap tiga kategori. intervalBerisikoBawah tidak menambah
  // kategori; nilainya dipakai sebagai penanda prioritas pada rekomendasi.
  if (skor >= baik) return { kode: 'aman', label: 'Baik / Aman' }
  if (skor >= perhatian) return { kode: 'perhatian', label: 'Perlu Perhatian' }
  return { kode: 'berisiko', label: 'Berisiko / Butuh Tindak Lanjut' }
}

function ambangDariSetting(setting = {}) {
  return {
    ambangAkademik: Number(setting.ambangAkademik ?? AMBANG_REKOMENDASI.ambangAkademik),
    ambangSikap: Number(setting.ambangSikap ?? AMBANG_REKOMENDASI.ambangSikap),
    ambangKehadiran: Number(setting.ambangKehadiran ?? AMBANG_REKOMENDASI.ambangKehadiran),
    kkmMapel: Number(setting.kkmMapel ?? AMBANG_MAPEL.kkmMapel),
    ambangUnggul: Number(setting.ambangUnggul ?? AMBANG_MAPEL.ambangUnggul)
  }
}

function batasDariSetting(setting = {}) {
  return {
    intervalBerisikoBawah: Number(setting.intervalBerisikoBawah ?? 0)
  }
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

function hasilBelumLengkap(siswaId, kelengkapan, detail = {}, setting = {}) {
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
      ringkasanMapel: detail.ringkasanMapel ?? [],
      totalHari: detail.totalHari ?? null,
      hariTercatat: detail.hariTercatat ?? null,
      jumlahHadirEfektif: detail.jumlahHadirEfektif ?? null,
      jumlahAlpa: detail.jumlahAlpa ?? null,
      nilaiSikap: detail.nilaiSikap ?? null,
      totalPenguranganSikap: detail.totalPenguranganSikap ?? null,
      jumlahCatatanSikap: detail.jumlahCatatanSikap ?? null,
      sikapTanpaCatatan: detail.sikapTanpaCatatan ?? false
    },
    batas: batasDariSetting(setting),
    ambang: ambangDariSetting(setting)
  }
}

/**
 * Menghitung skor SAW dari data yang sudah diagregasi.
 *
 * totalHariSekolah: jumlah tanggal unik yang tercatat pada tahun
 *   ajaran/periode berjalan (denominator tetap tanggal tercatat).
 * sikapCatatan: catatan kejadian yang tersimpan pada periode berjalan.
 *   Nilai sikap dihitung dari dasar 100 dikurangi pengurangan yang relevan.
 *   Tanpa catatan berarti tidak ada pengurangan, bukan predikat tertentu.
 */
export function hitungSkorData(
  { nilaiRows = [], hadirStatus = [], sikapCatatan = [], totalHariSekolah = null },
  setting = {}
) {
  // Akademik: rata-rata tiap mapel lebih dulu, kemudian rata-rata dari
  // seluruh rata-rata mapel. Jumlah catatan di satu mapel tidak menambah
  // bobot mapel tersebut.
  const { rata: rataNilai, perMapel } = agregasiNilai(nilaiRows)
  const skorAkademik = rataNilai === null ? null : rataNilai / 100

  const totalHariTercatat = hadirStatus.length
  const jumlahHadirEfektif = hadirStatus.filter((st) => STATUS_EFEKTIF.has(st)).length
  const jumlahAlpa = hadirStatus.filter((st) => st === 'alpa').length
  const skorKehadiran = totalHariTercatat
    ? jumlahHadirEfektif / totalHariTercatat
    : null

  const daftarCatatan = Array.isArray(sikapCatatan) ? sikapCatatan : []
  const penguranganSikap = totalPenguranganSikap(daftarCatatan)
  const nilaiSikap = hitungNilaiSikap(daftarCatatan)
  const skorSikap = normalizeSikap(nilaiSikap)
  const sikapTanpaCatatan = daftarCatatan.length === 0

  const kelengkapan = {
    akademik: perMapel.length > 0,
    kehadiran: Number(totalHariSekolah) > 0 && totalHariTercatat >= Number(totalHariSekolah),
    sikap: true
  }
  const detail = {
    rataNilai: rataNilai === null ? null : Number(rataNilai.toFixed(2)),
    ringkasanMapel: perMapel.map((m) => ({ ...m, rata: Number(m.rata.toFixed(2)) })),
    totalHari: Number(totalHariSekolah) || 0,
    hariTercatat: totalHariTercatat,
    jumlahHadirEfektif,
    jumlahAlpa,
    nilaiSikap,
    totalPenguranganSikap: penguranganSikap,
    jumlahCatatanSikap: daftarCatatan.length,
    sikapTanpaCatatan
  }

  if (!kelengkapan.akademik || !kelengkapan.kehadiran) {
    return hasilBelumLengkap(null, kelengkapan, detail, setting)
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
    detail,
    batas: batasDariSetting(setting),
    ambang: ambangDariSetting(setting)
  }
}

export function kelompokkanNilai(nilaiRows = []) {
  const perMapel = {}
  for (const r of nilaiRows) {
    const nama = r.mapel?.nama || r.nama || 'Tanpa mapel'
    if (!perMapel[nama]) perMapel[nama] = []
    perMapel[nama].push(Number(r.nilai))
  }
  return Object.entries(perMapel).map(([nama, nilai]) => ({ nama, nilai }))
}

export function agregasiNilai(nilaiRows = []) {
  const perMapel = kelompokkanNilai(nilaiRows).map(({ nama, nilai }) => ({
    nama,
    rata: nilai.reduce((a, b) => a + b, 0) / nilai.length,
    jumlah: nilai.length
  }))
  const rata = perMapel.length
    ? perMapel.reduce((a, m) => a + m.rata, 0) / perMapel.length
    : null
  return { rata, perMapel }
}

export function agregasiMapel(nilaiRows = []) {
  const { perMapel } = agregasiNilai(nilaiRows)
  if (!perMapel.length) return null
  const terendah = [...perMapel].sort((a, b) => a.rata - b.rata)[0]
  return { nama: terendah.nama, rata: terendah.rata }
}

export function agregasiMapelUnggul(nilaiRows = []) {
  const { perMapel } = agregasiNilai(nilaiRows)
  if (!perMapel.length) return null
  const tertinggi = [...perMapel].sort((a, b) => b.rata - a.rata)[0]
  return { nama: tertinggi.nama, rata: tertinggi.rata }
}

async function jumlahHariSekolah(tahunAjaranId, rentang) {
  const where = { ...whereTanggal(rentang) }
  if (tahunAjaranId != null) where.tahunAjaranId = tahunAjaranId
  const rows = await Kehadiran.findAll({ where, attributes: ['tanggal'], raw: true })
  // Denominator tetap tanggal yang benar-benar tercatat pada periode
  // (tidak ada tabel kalender hari sekolah/libur baru).
  return new Set(rows.map((r) => String(r.tanggal).slice(0, 10))).size
}

export async function hitungSkorSiswa(siswaId, tahunAjaranId, setting = null, rentang = null) {
  const s = setting || (await SettingSpk.findOne()) || BOBOT_SAW
  const siswa = await Siswa.findByPk(siswaId)
  if (!siswa) throw new Error('Siswa tidak ditemukan.')

  if (siswa.statusABK) return hasilAbk(siswaId)

  const periode = await tentukanRentang(tahunAjaranId, rentang)
  const whereTA = { siswaId, ...whereTanggal(periode) }
  if (tahunAjaranId != null) whereTA.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows, totalHari] = await Promise.all([
    Nilai.findAll({ where: whereTA, include: [{ association: 'mapel' }] }),
    Kehadiran.findAll({ where: whereTA }),
    Sikap.findAll({ where: whereTA }),
    jumlahHariSekolah(tahunAjaranId, periode)
  ])

  const hasil = hitungSkorData(
    {
      nilaiRows,
      hadirStatus: hadirRows.map((k) => k.status),
      sikapCatatan: sikapRows,
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
      pesan: 'Lengkapi data nilai dan kehadiran pada semester aktif sebelum hasil SAW ditampilkan.',
      daftar: [
        'Lengkapi nilai akademik dan rekap kehadiran pada semester ini',
        'Jangan klasifikasikan sebagai berisiko hanya karena data belum tersedia',
        'Tampilkan rekomendasi setelah seluruh kriteria terpenuhi'
      ]
    }
  }

  const ambang = { ...AMBANG_REKOMENDASI, ...AMBANG_MAPEL, ...(hasil?.ambang || {}) }
  const batas = { intervalBerisikoBawah: 0, ...(hasil?.batas || {}) }
  const { skorAkademik, skorKehadiran, skorSikap } = hasil
  const akademikRendah = Number(skorAkademik) < Number(ambang.ambangAkademik)
  const sikapRendah = Number(skorSikap) < Number(ambang.ambangSikap)
  const kehadiranRendah = Number(skorKehadiran) < Number(ambang.ambangKehadiran)

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

  // Rulebase berbasis rata-rata per mapel. Dua aturan dapat muncul bersamaan
  // untuk siswa yang sekaligus memiliki mapel lemah dan mapel unggul.
  const ringkasanMapel = Array.isArray(hasil?.detail?.ringkasanMapel)
    ? hasil.detail.ringkasanMapel
    : []
  const kkm = Number(ambang.kkmMapel)
  const unggul = Number(ambang.ambangUnggul)
  for (const m of ringkasanMapel) {
    const rata = Number(m.rata)
    if (rata < kkm) {
      daftar.push(`Bimbingan tambahan pada ${m.nama} (rata ${m.rata} di bawah KKM ${kkm})`)
    } else if (rata >= unggul) {
      daftar.push(`Pengayaan/pendalaman ${m.nama} (rata ${m.rata} mencapai ambang unggul ${unggul})`)
    }
  }

  // Batas bawah berisiko tidak menambah kategori; ia hanya menandai bahwa
  // tindak lanjut perlu diprioritaskan.
  const skorAkhir = Number(hasil?.skor)
  if (Number.isFinite(skorAkhir) && skorAkhir < Number(batas.intervalBerisikoBawah)) {
    daftar.unshift('Prioritaskan tindak lanjut intensif (skor di bawah batas berisiko).')
  }

  if (!daftar.length) {
    return {
      tipe: 'baik',
      pesan: 'Perkembangan siswa dalam kondisi baik, pertahankan',
      daftar: ['Perkembangan siswa dalam kondisi baik, pertahankan']
    }
  }

  const jumlahRendah = [akademikRendah, kehadiranRendah, sikapRendah].filter(Boolean).length
  const tipe = jumlahRendah > 1
    ? 'gabungan'
    : akademikRendah
      ? 'akademik'
      : kehadiranRendah
        ? 'kehadiran'
        : sikapRendah
          ? 'sikap'
          : 'mapel'
  return { tipe, pesan: daftar[0], daftar }
}

export async function rekapKelas(kelasId, tahunAjaranId, rentang = null) {
  const siswaList = await Siswa.findAll({ where: { kelasId }, order: [['nomorAbsen', 'ASC']] })
  const hasilList = await hitungSemuaSiswa(siswaList, tahunAjaranId, rentang)

  const ringkas = { aman: 0, perhatian: 0, berisiko: 0, abk: 0, data_belum_lengkap: 0, total: hasilList.length }
  for (const { hasil } of hasilList) {
    if (hasil.kategori.kode in ringkas) ringkas[hasil.kategori.kode]++
  }

  return { hasilList, ringkas }
}

export async function mapelTerlemah(siswaId, tahunAjaranId, rentang = null) {
  const periode = await tentukanRentang(tahunAjaranId, rentang)
  const rows = await Nilai.findAll({
    where: { siswaId, tahunAjaranId, ...whereTanggal(periode) },
    include: [{ association: 'mapel' }]
  })
  return agregasiMapel(rows)
}

export async function hitungSemuaSiswa(siswaList, tahunAjaranId, rentang = null) {
  if (!siswaList.length) return []

  const s = (await SettingSpk.findOne()) || BOBOT_SAW
  const periode = await tentukanRentang(tahunAjaranId, rentang)
  const ids = siswaList.map((x) => x.id)
  const baseWhere = { siswaId: { [Op.in]: ids }, ...whereTanggal(periode) }
  if (tahunAjaranId != null) baseWhere.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows, totalHari] = await Promise.all([
    Nilai.findAll({ where: baseWhere, include: [{ association: 'mapel' }] }),
    Kehadiran.findAll({ where: baseWhere }),
    Sikap.findAll({ where: baseWhere }),
    jumlahHariSekolah(tahunAjaranId, periode)
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
          nilaiRows: nRows,
          hadirStatus: (gHadir.get(siswa.id) || []).map((k) => k.status),
          sikapCatatan: gSikap.get(siswa.id) || [],
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
