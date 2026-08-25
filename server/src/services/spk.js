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

export function hasilAbk(siswaId = null) {
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

export function hitungSkorData({ nilaiAngka = [], hadirStatus = [], sikapAngka = [] }, setting) {
  const rataNilai = nilaiAngka.length ? nilaiAngka.reduce((a, b) => a + b, 0) / nilaiAngka.length : 0
  const skorAkademik = nilaiAngka.length ? rataNilai / 100 : 0

  const total = hadirStatus.length
  const jumlahHadir = hadirStatus.filter((st) => st === 'hadir').length
  const skorKehadiran = total ? jumlahHadir / total : 0

  const rataSikap = sikapAngka.length ? sikapAngka.reduce((a, b) => a + b, 0) / sikapAngka.length : 0
  const skorSikap = sikapAngka.length ? rataSikap / 4 : 0

  const skor =
    skorAkademik * setting.bobotAkademik + skorKehadiran * setting.bobotKehadiran + skorSikap * setting.bobotSikap

  return {
    siswaId: null,
    abk: false,
    skor: Number(skor.toFixed(4)),
    skorAkademik: Number(skorAkademik.toFixed(4)),
    skorKehadiran: Number(skorKehadiran.toFixed(4)),
    skorSikap: Number(skorSikap.toFixed(4)),
    kategori: kategoriDariSkor(skor, setting),
    detail: {
      rataNilai: Number(rataNilai.toFixed(2)),
      totalHari: total,
      jumlahHadir,
      rataSikap: Number(rataSikap.toFixed(2))
    }
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

export async function hitungSkorSiswa(siswaId, tahunAjaranId, setting = null, rentang = null) {
  const s = setting || (await SettingSpk.findOne())
  if (!s) throw new Error('Konfigurasi SPK belum diatur.')

  const siswa = await Siswa.findByPk(siswaId)
  if (!siswa) throw new Error('Siswa tidak ditemukan.')

  if (siswa.statusABK) return hasilAbk(siswaId)

  const whereTA = { siswaId, ...whereTanggal(rentang) }
  if (tahunAjaranId != null) whereTA.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows] = await Promise.all([
    Nilai.findAll({ where: whereTA }),
    Kehadiran.findAll({ where: whereTA }),
    Sikap.findAll({ where: whereTA })
  ])

  const hasil = hitungSkorData(
    {
      nilaiAngka: nilaiRows.map((n) => Number(n.nilai)),
      hadirStatus: hadirRows.map((k) => k.status),
      sikapAngka: sikapRows.map((x) => Number(x.nilai))
    },
    s
  )
  return { ...hasil, siswaId }
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
  return agregasiMapel(rows)
}

export async function hitungSemuaSiswa(siswaList, tahunAjaranId, rentang = null) {
  if (!siswaList.length) return []

  const s = await SettingSpk.findOne()
  if (!s) throw new Error('Konfigurasi SPK belum diatur.')

  const ids = siswaList.map((x) => x.id)
  const baseWhere = { siswaId: { [Op.in]: ids }, ...whereTanggal(rentang) }
  if (tahunAjaranId != null) baseWhere.tahunAjaranId = tahunAjaranId

  const [nilaiRows, hadirRows, sikapRows] = await Promise.all([
    Nilai.findAll({ where: baseWhere, include: [{ association: 'mapel' }] }),
    Kehadiran.findAll({ where: baseWhere }),
    Sikap.findAll({ where: baseWhere })
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
          sikapAngka: (gSikap.get(siswa.id) || []).map((x) => Number(x.nilai))
        },
        s
      ),
      siswaId: siswa.id
    }
    const lemah = agregasiMapel(nRows)
    return { siswa, hasil, mapelTerlemah: lemah }
  })
}
