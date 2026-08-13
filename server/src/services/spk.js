import { Nilai, Kehadiran, Sikap, SettingSpk, Siswa } from '../models/index.js'
import { Op } from 'sequelize'

function whereTanggal(rentang) {
  const cond = {}
  if (rentang?.mulai) cond.tanggal = { ...(cond.tanggal || {}), [Op.gte]: rentang.mulai }
  if (rentang?.akhir) cond.tanggal = { ...(cond.tanggal || {}), [Op.lte]: rentang.akhir }
  return cond
}

export function normalizeSikap(nilaiSkala4) {
  return nilaiSkala4 / 4
}

export function kategoriDariSkor(skor, setting) {
  if (skor >= setting.intervalBaikBawah) return { kode: 'aman', label: 'Baik / Aman' }
  if (skor >= setting.intervalPerhatianBawah) return { kode: 'perhatian', label: 'Perlu Perhatian' }
  return { kode: 'berisiko', label: 'Berisiko / Butuh Tindak Lanjut' }
}

export async function hitungSkorSiswa(siswaId, tahunAjaranId, setting = null, rentang = null) {
  const s = setting || (await SettingSpk.findOne())
  if (!s) throw new Error('Konfigurasi SPK belum diatur.')

  const siswa = await Siswa.findByPk(siswaId)
  if (!siswa) throw new Error('Siswa tidak ditemukan.')

  if (siswa.statusABK) {
    return {
      siswaId,
      abk: true,
      skor: null,
      skorAkademik: null,
      skorKehadiran: null,
      skorSikap: null,
      kategori: { kode: 'abk', label: 'Anak Berkebutuhan Khusus' }
    }
  }

  const whereTA = { tahunAjaranId, ...whereTanggal(rentang) }

  const nilaiRows = await Nilai.findAll({ where: { ...whereTA, siswaId } })
  const nilaiAngka = nilaiRows.map((n) => Number(n.nilai))
  const rataNilai = nilaiAngka.length ? nilaiAngka.reduce((a, b) => a + b, 0) / nilaiAngka.length : 0
  const skorAkademik = nilaiAngka.length ? rataNilai / 100 : 0

  const hadirRows = await Kehadiran.findAll({ where: { ...whereTA, siswaId } })
  const total = hadirRows.length
  const jumlahHadir = hadirRows.filter((k) => k.status === 'hadir').length
  const skorKehadiran = total ? jumlahHadir / total : 0

  const sikapRows = await Sikap.findAll({ where: { ...whereTA, siswaId } })
  const sikapAngka = sikapRows.map((x) => Number(x.nilai))
  const rataSikap = sikapAngka.length ? sikapAngka.reduce((a, b) => a + b, 0) / sikapAngka.length : 0
  const skorSikap = sikapAngka.length ? rataSikap / 4 : 0

  const skor =
    skorAkademik * s.bobotAkademik + skorKehadiran * s.bobotKehadiran + skorSikap * s.bobotSikap

  return {
    siswaId,
    abk: false,
    skor: Number(skor.toFixed(4)),
    skorAkademik: Number(skorAkademik.toFixed(4)),
    skorKehadiran: Number(skorKehadiran.toFixed(4)),
    skorSikap: Number(skorSikap.toFixed(4)),
    kategori: kategoriDariSkor(skor, s),
    detail: {
      rataNilai: Number(rataNilai.toFixed(2)),
      totalHari: total,
      jumlahHadir,
      rataSikap: Number(rataSikap.toFixed(2))
    }
  }
}

export function rekomendasiUntuk(hasil, mapelTerlemah = null) {
  if (hasil.abk) {
    return {
      tipe: 'abk',
      pesan: 'Dikecualikan dari skoring otomatis SPK. Gunakan pendekatan pembelajaran khusus sesuai catatan ABK siswa.',
      daftar: ['Dikecualikan dari klasifikasi otomatis', 'Terapkan pendekatan pembelajaran sesuai kebutuhan khusus']
    }
  }

  const { skorAkademik, skorKehadiran, skorSikap } = hasil
  const akademikRendah = skorAkademik < 0.65
  const sikapRendah = skorSikap < 0.65
  const kehadiranRendah = skorKehadiran < 0.8

  const daftar = []
  let tipe = 'baik'

  if (kehadiranRendah && !akademikRendah && !sikapRendah) {
    tipe = 'kehadiran'
    daftar.push('Investigasi penyebab ketidakhadiran siswa')
    daftar.push('Lakukan coaching / komunikasi dengan orang tua')
  }

  if (akademikRendah) {
    tipe = 'akademik'
    daftar.push('Berikan les atau bimbingan tambahan')
    if (mapelTerlemah) daftar.push(`Fokus pada mata pelajaran terlemah: ${mapelTerlemah}`)
  }

  if (sikapRendah) {
    tipe = 'sikap'
    daftar.push('Lakukan pendekatan personal / coaching kepada siswa dan orang tua')
    daftar.push('Bina karakter melalui kegiatan kelas dan pembiasaan positif')
  }

  if (!daftar.length) {
    daftar.push('Perkembangan siswa dalam kondisi baik, pertahankan')
  }

  return { tipe, pesan: daftar[0], daftar }
}

export async function rekapKelas(kelasId, tahunAjaranId) {
  const setting = await SettingSpk.findOne()
  const siswaList = await Siswa.findAll({ where: { kelasId } })

  const hasilList = []
  for (const siswa of siswaList) {
    const hasil = await hitungSkorSiswa(siswa.id, tahunAjaranId, setting)
    hasilList.push({ siswa, hasil })
  }

  const ringkas = { aman: 0, perhatian: 0, berisiko: 0, abk: 0, total: hasilList.length }
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
  if (!rows.length) return null
  const perMapel = {}
  for (const r of rows) {
    const nama = r.mapel?.nama || 'Tanpa mapel'
    perMapel[nama] = perMapel[nama] || []
    perMapel[nama].push(Number(r.nilai))
  }
  const avgs = Object.entries(perMapel).map(([nama, vals]) => ({
    nama,
    rata: vals.reduce((a, b) => a + b, 0) / vals.length
  }))
  avgs.sort((a, b) => a.rata - b.rata)
  return avgs[0]
}
