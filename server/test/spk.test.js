import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  AMBANG_REKOMENDASI,
  AMBANG_MAPEL,
  BOBOT_SAW,
  normalizeSikap,
  totalPenguranganSikap,
  kategoriDariSkor,
  hasilAbk,
  hitungSkorData,
  agregasiMapel,
  rekomendasiUntuk,
  rentangSemester,
  labelPeriode
} from '../src/services/spk.js'

const setting = {
  ...BOBOT_SAW,
  intervalBaikBawah: 0.67,
  intervalPerhatianBawah: 0.34,
  intervalBerisikoBawah: 0,
  ...AMBANG_REKOMENDASI,
  ...AMBANG_MAPEL
}

const lengkap = {
  nilaiRows: [{ mapel: { nama: 'IPA' }, nilai: 100 }],
  hadirStatus: ['hadir', 'izin', 'sakit'],
  sikapCatatan: [],
  totalHariSekolah: 3
}

const skorDari = (akademik, kehadiran, sikap) =>
  Number((akademik * (4 / 13) + kehadiran * (4 / 13) + sikap * (5 / 13)).toFixed(4))

describe('bobot SAW', () => {
  test('menggunakan rasio presisi 4:4:5', () => {
    assert.equal(BOBOT_SAW.bobotAkademik, 4 / 13)
    assert.equal(BOBOT_SAW.bobotKehadiran, 4 / 13)
    assert.equal(BOBOT_SAW.bobotSikap, 5 / 13)
    assert.ok(Math.abs(Object.values(BOBOT_SAW).reduce((a, b) => a + b, 0) - 1) < 1e-12)
  })
})

describe('normalizeSikap', () => {
  test('nilai dasar 100 menjadi 1 dan pengurangan menjadi proporsi 0-1', () => {
    assert.equal(normalizeSikap(100), 1)
    assert.equal(normalizeSikap(95), 0.95)
    assert.equal(normalizeSikap(50), 0.5)
    assert.equal(normalizeSikap(0), 0)
  })

  test('nilai di luar rentang dibatasi ke 0 atau 1', () => {
    assert.equal(normalizeSikap(-5), 0)
    assert.equal(normalizeSikap(120), 1)
    assert.equal(normalizeSikap('bukan angka'), 0)
  })
})

describe('totalPenguranganSikap', () => {
  test('tanpa catatan negatif tidak ada pengurangan', () => {
    assert.equal(totalPenguranganSikap([]), 0)
  })

  test('satu catatan pengurangan 5 dijumlahkan sekali', () => {
    assert.equal(totalPenguranganSikap([{ kategori: 'Tidak mengerjakan tugas', pengurangan: 5 }]), 5)
  })

  test('beberapa catatan dijumlahkan', () => {
    const catatan = [
      { kategori: 'Tidak mengerjakan tugas', pengurangan: 5 },
      { kategori: 'Berkelahi dengan teman', pengurangan: 10 },
      { kategori: 'Memalak uang teman', pengurangan: 20 }
    ]
    assert.equal(totalPenguranganSikap(catatan), 35)
  })

  test('snapshot pengurangan mengalahkan konfigurasi kategori', () => {
    const catatan = [{ kategori: 'Tidak mengerjakan tugas', pengurangan: 7 }]
    assert.equal(totalPenguranganSikap(catatan), 7)
  })

  test('catatan Bolos tidak menyumbang pengurangan sikap', () => {
    const catatan = [{ kategori: 'Bolos', pengurangan: 0, kehadiranId: 77 }]
    assert.equal(totalPenguranganSikap(catatan), 0)
  })

  test('aspek sosial dan spiritual masuk ke satu total yang sama', () => {
    const catatan = [
      { kategori: 'Tidak mengerjakan tugas', jenis: 'sosial', pengurangan: 5 },
      { kategori: 'Tidak sopan kepada guru', jenis: 'spiritual', pengurangan: 10 }
    ]
    assert.equal(totalPenguranganSikap(catatan), 15)
  })
})

describe('kategoriDariSkor', () => {
  const interval = { intervalBaikBawah: 0.8, intervalPerhatianBawah: 0.5, intervalBerisikoBawah: 0.2 }

  test('batas bawah aman termasuk aman', () => {
    assert.equal(kategoriDariSkor(0.8, interval).kode, 'aman')
  })
  test('di bawah aman masuk perhatian', () => {
    assert.equal(kategoriDariSkor(0.79, interval).kode, 'perhatian')
  })
  test('batas bawah perhatian termasuk perhatian', () => {
    assert.equal(kategoriDariSkor(0.5, interval).kode, 'perhatian')
  })
  test('batas bawah berisiko termasuk berisiko', () => {
    assert.equal(kategoriDariSkor(0.2, interval).kode, 'berisiko')
  })
  test('di bawah batas berisiko tetap berisiko', () => {
    assert.equal(kategoriDariSkor(0.19, interval).kode, 'berisiko')
  })
})

describe('hasilAbk', () => {
  test('skor null dan kategori abk', () => {
    const h = hasilAbk(7)
    assert.equal(h.siswaId, 7)
    assert.equal(h.abk, true)
    assert.equal(h.lengkap, false)
    assert.equal(h.skor, null)
    assert.equal(h.kategori.kode, 'abk')
  })
})

describe('hitungSkorData - kelengkapan', () => {
  test('data kosong menjadi data belum lengkap, bukan berisiko', () => {
    const h = hitungSkorData({}, setting)
    assert.equal(h.lengkap, false)
    assert.equal(h.skor, null)
    assert.equal(h.kategori.kode, 'data_belum_lengkap')
    // Tanpa catatan sikap berarti nilaiSikap 100, sehingga yang menggagalkan
    // kelengkapan hanya nilai dan kehadiran.
    assert.deepEqual(h.kelengkapan, { akademik: false, kehadiran: false, sikap: true })
    assert.equal(h.detail.nilaiSikap, 100)
    assert.equal(h.detail.totalPenguranganSikap, 0)
    assert.equal(h.detail.jumlahCatatanSikap, 0)
    assert.equal(h.detail.sikapTanpaCatatan, true)
  })

  test('tanpa catatan sikap tetap lengkap dengan nilaiSikap 100', () => {
    const h = hitungSkorData(lengkap, setting)
    assert.equal(h.lengkap, true)
    assert.equal(h.kategori.kode, 'aman')
    assert.equal(h.kelengkapan.sikap, true)
    assert.equal(h.skorSikap, 1)
    assert.equal(h.detail.nilaiSikap, 100)
    assert.equal(h.detail.jumlahCatatanSikap, 0)
    assert.equal(h.detail.sikapTanpaCatatan, true)
  })

  test('cakupan kehadiran kurang dari hari sekolah menjadi data belum lengkap', () => {
    const h = hitungSkorData({ ...lengkap, totalHariSekolah: 4 }, setting)
    assert.equal(h.lengkap, false)
    assert.equal(h.kategori.kode, 'data_belum_lengkap')
    assert.equal(h.kelengkapan.kehadiran, false)
  })

  test('tanpa nilai akademik menjadi data belum lengkap', () => {
    const h = hitungSkorData({ ...lengkap, nilaiRows: [] }, setting)
    assert.equal(h.lengkap, false)
    assert.equal(h.kategori.kode, 'data_belum_lengkap')
    assert.equal(h.kelengkapan.akademik, false)
  })
})

describe('hitungSkorData - perhitungan', () => {
  test('satu catatan pengurangan 5 menghasilkan nilaiSikap 95', () => {
    const h = hitungSkorData(
      { ...lengkap, sikapCatatan: [{ kategori: 'Tidak mengerjakan tugas', pengurangan: 5 }] },
      setting
    )
    assert.equal(h.lengkap, true)
    assert.equal(h.detail.nilaiSikap, 95)
    assert.equal(h.detail.totalPenguranganSikap, 5)
    assert.equal(h.detail.jumlahCatatanSikap, 1)
    assert.equal(h.detail.sikapTanpaCatatan, false)
    assert.equal(h.skorSikap, 0.95)
    assert.equal(h.skor, skorDari(1, 1, 0.95))
    assert.equal(h.kategori.kode, 'aman')
  })

  test('beberapa catatan dijumlahkan sebelum dinormalisasi', () => {
    const catatan = [
      { kategori: 'Tidak mengerjakan tugas', pengurangan: 5 },
      { kategori: 'Berkelahi dengan teman', pengurangan: 10 },
      { kategori: 'Memalak uang teman', pengurangan: 20 }
    ]
    const h = hitungSkorData({ ...lengkap, sikapCatatan: catatan }, setting)
    assert.equal(h.detail.totalPenguranganSikap, 35)
    assert.equal(h.detail.nilaiSikap, 65)
    assert.equal(h.skorSikap, 0.65)
    assert.equal(h.skor, skorDari(1, 1, 0.65))
  })

  test('akumulasi pengurangan lebih dari 100 dibatasi ke nilaiSikap 0', () => {
    const catatan = Array.from({ length: 6 }, () => ({ kategori: 'Membully teman/perundungan', pengurangan: 20 }))
    const h = hitungSkorData({ ...lengkap, sikapCatatan: catatan }, setting)
    assert.equal(h.detail.totalPenguranganSikap, 120)
    assert.equal(h.detail.nilaiSikap, 0)
    assert.equal(h.skorSikap, 0)
    assert.equal(h.skor, skorDari(1, 1, 0))
  })

  test('catatan Bolos tidak mengurangi sikap; alpa mengurangi kehadiran saja', () => {
    const h = hitungSkorData(
      {
        ...lengkap,
        hadirStatus: ['hadir', 'alpa'],
        totalHariSekolah: 2,
        sikapCatatan: [{ kategori: 'Bolos', pengurangan: 0, kehadiranId: 77 }]
      },
      setting
    )
    assert.equal(h.skorKehadiran, 0.5)
    assert.equal(h.detail.jumlahAlpa, 1)
    assert.equal(h.detail.totalPenguranganSikap, 0)
    assert.equal(h.detail.nilaiSikap, 100)
    assert.equal(h.skorSikap, 1)
    assert.equal(h.skor, skorDari(1, 0.5, 1))
  })

  test('izin dan sakit tetap dihitung sebagai kehadiran efektif', () => {
    const h = hitungSkorData(lengkap, setting)
    assert.equal(h.skorKehadiran, 1)
    assert.equal(h.detail.jumlahHadirEfektif, 3)
    assert.equal(h.detail.jumlahAlpa, 0)
  })

  test('catatan sosial dan spiritual menghasilkan satu skor sikap', () => {
    const catatan = [
      { kategori: 'Tidak mengerjakan tugas', jenis: 'sosial', pengurangan: 5 },
      { kategori: 'Tidak sopan kepada guru', jenis: 'spiritual', pengurangan: 10 }
    ]
    const h = hitungSkorData({ ...lengkap, sikapCatatan: catatan }, setting)
    assert.equal(h.detail.jumlahCatatanSikap, 2)
    assert.equal(h.detail.totalPenguranganSikap, 15)
    assert.equal(h.detail.nilaiSikap, 85)
    assert.equal(h.skorSikap, 0.85)
    assert.equal(h.skor, skorDari(1, 1, 0.85))
  })

  test('akademik rata-rata tiap mapel dulu, bobot presisi dipakai sebelum pembulatan', () => {
    const catatan = [
      { kategori: 'Memalak uang teman', pengurangan: 20 },
      { kategori: 'Membully teman/perundungan', pengurangan: 20 },
      { kategori: 'Berkelahi dengan teman', pengurangan: 10 }
    ]
    const h = hitungSkorData(
      {
        nilaiRows: [
          { mapel: { nama: 'IPA' }, nilai: 80 },
          { mapel: { nama: 'IPA' }, nilai: 90 },
          { mapel: { nama: 'Bahasa Indonesia' }, nilai: 70 }
        ],
        hadirStatus: ['hadir', 'izin', 'sakit', 'alpa'],
        sikapCatatan: catatan,
        totalHariSekolah: 4
      },
      setting
    )
    assert.equal(h.detail.rataNilai, 77.5)
    assert.deepEqual(h.detail.ringkasanMapel, [
      { nama: 'IPA', rata: 85, jumlah: 2 },
      { nama: 'Bahasa Indonesia', rata: 70, jumlah: 1 }
    ])
    assert.equal(h.skorAkademik, 0.775)
    assert.equal(h.skorKehadiran, 0.75)
    assert.equal(h.skorSikap, 0.5)
    assert.equal(h.skor, skorDari(0.775, 0.75, 0.5))
    // 8,6/13 ≈ 0,6615 -> di bawah batas aman 0,67.
    assert.equal(h.kategori.kode, 'perhatian')
  })

  test('banyak catatan pada satu mapel tidak menambah bobot mapel tersebut', () => {
    const dasar = { hadirStatus: ['hadir'], sikapCatatan: [], totalHariSekolah: 1 }
    const duaMapel = hitungSkorData(
      {
        ...dasar,
        nilaiRows: [
          { mapel: { nama: 'IPA' }, nilai: 80 },
          { mapel: { nama: 'Bahasa Indonesia' }, nilai: 60 }
        ]
      },
      setting
    )
    const banyakCatatan = hitungSkorData(
      {
        ...dasar,
        nilaiRows: [
          { mapel: { nama: 'IPA' }, nilai: 80 },
          { mapel: { nama: 'IPA' }, nilai: 80 },
          { mapel: { nama: 'IPA' }, nilai: 80 },
          { mapel: { nama: 'Bahasa Indonesia' }, nilai: 60 }
        ]
      },
      setting
    )
    assert.equal(duaMapel.skorAkademik, 0.7)
    assert.equal(banyakCatatan.skorAkademik, 0.7)
    assert.equal(banyakCatatan.skor, duaMapel.skor)
  })
})

describe('agregasiMapel', () => {
  test('null jika tidak ada baris nilai', () => {
    assert.equal(agregasiMapel([]), null)
  })

  test('mengembalikan mapel dengan rata-rata terendah', () => {
    const rows = [
      { mapel: { nama: 'Matematika' }, nilai: '90' },
      { mapel: { nama: 'Matematika' }, nilai: '80' },
      { mapel: { nama: 'Bahasa Indonesia' }, nilai: '60' }
    ]
    const lemah = agregasiMapel(rows)
    assert.equal(lemah.nama, 'Bahasa Indonesia')
    assert.equal(lemah.rata, 60)
  })

  test('baris tanpa relasi mapel masuk kelompok Tanpa mapel', () => {
    const lemah = agregasiMapel([{ mapel: null, nilai: '70' }])
    assert.equal(lemah.nama, 'Tanpa mapel')
  })
})

describe('rekomendasiUntuk', () => {
  test('siswa ABK dikecualikan dari skoring', () => {
    const r = rekomendasiUntuk({ abk: true })
    assert.equal(r.tipe, 'abk')
  })

  test('data belum lengkap tidak diberi rekomendasi berisiko', () => {
    const r = rekomendasiUntuk(hitungSkorData({}, setting))
    assert.equal(r.tipe, 'data_belum_lengkap')
    assert.ok(r.daftar.some((d) => /Jangan klasifikasikan/.test(d)))
  })

  test('kehadiran rendah sendirian memberi tipe kehadiran', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.7, skorAkademik: 0.9, skorKehadiran: 0.5, skorSikap: 0.9 })
    assert.equal(r.tipe, 'kehadiran')
    assert.ok(r.daftar.length >= 2)
  })

  test('akademik rendah memunculkan fokus mapel terlemah', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.7, skorAkademik: 0.4, skorKehadiran: 0.95, skorSikap: 0.9 }, 'IPA')
    assert.equal(r.tipe, 'akademik')
    assert.ok(r.daftar.some((d) => d.includes('IPA')))
  })

  test('sikap rendah memberi tipe sikap', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.7, skorAkademik: 0.9, skorKehadiran: 0.95, skorSikap: 0.3 })
    assert.equal(r.tipe, 'sikap')
  })

  test('semua baik memberi pesan pertahankan', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.9, skorAkademik: 0.9, skorKehadiran: 0.95, skorSikap: 0.9 })
    assert.equal(r.tipe, 'baik')
    assert.match(r.pesan, /pertahankan/)
  })

  test('beberapa kriteria rendah menghasilkan rekomendasi gabungan', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.5, skorAkademik: 0.4, skorKehadiran: 0.95, skorSikap: 0.3 }, 'IPA')
    assert.equal(r.tipe, 'gabungan')
    assert.ok(r.daftar.some((d) => d.includes('bimbingan')))
    assert.ok(r.daftar.some((d) => /personal/.test(d)))
  })

  test('tiga kriteria rendah memasukkan rekomendasi kehadiran', () => {
    const r = rekomendasiUntuk({ abk: false, lengkap: true, skor: 0.4, skorAkademik: 0.4, skorKehadiran: 0.5, skorSikap: 0.3 })
    assert.equal(r.tipe, 'gabungan')
    assert.ok(r.daftar.some((d) => /ketidakhadiran/.test(d)))
  })

  test('memakai ambang yang diatur admin', () => {
    const hasil = hitungSkorData(
      { nilaiRows: [{ mapel: { nama: 'IPA' }, nilai: 70 }], hadirStatus: ['hadir'], sikapCatatan: [], totalHariSekolah: 1 },
      {
        ...setting,
        bobotAkademik: 1,
        bobotKehadiran: 0,
        bobotSikap: 0,
        ambangAkademik: 0.6
      }
    )
    assert.equal(hasil.skorAkademik, 0.7)
    assert.deepEqual(hasil.ambang, {
      ambangAkademik: 0.6,
      ambangSikap: 0.65,
      ambangKehadiran: 0.8,
      kkmMapel: 70,
      ambangUnggul: 85
    })
    assert.equal(rekomendasiUntuk(hasil).tipe, 'baik')

    const hasilKetat = hitungSkorData(
      { nilaiRows: [{ mapel: { nama: 'IPA' }, nilai: 70 }], hadirStatus: ['hadir'], sikapCatatan: [], totalHariSekolah: 1 },
      { ...setting, bobotAkademik: 1, bobotKehadiran: 0, bobotSikap: 0, ambangAkademik: 0.8 }
    )
    assert.equal(rekomendasiUntuk(hasilKetat).tipe, 'akademik')
  })

  test('rulebase memberi bimbingan mapel lemah dan pengayaan mapel unggul', () => {
    const hasil = {
      abk: false,
      lengkap: true,
      skor: 0.9,
      skorAkademik: 0.9,
      skorKehadiran: 0.95,
      skorSikap: 0.9,
      ambang: { ...AMBANG_REKOMENDASI, ...AMBANG_MAPEL },
      batas: { intervalBerisikoBawah: 0 },
      detail: {
        ringkasanMapel: [
          { nama: 'IPA', rata: 60, jumlah: 2 },
          { nama: 'Matematika', rata: 90, jumlah: 1 }
        ]
      }
    }
    const r = rekomendasiUntuk(hasil)
    assert.equal(r.tipe, 'mapel')
    assert.ok(r.daftar.some((d) => /Bimbingan tambahan pada IPA/.test(d)))
    assert.ok(r.daftar.some((d) => /Pengayaan\/pendalaman Matematika/.test(d)))
  })

  test('KKM yang diatur admin mengubah aturan mapel', () => {
    const hasil = {
      abk: false,
      lengkap: true,
      skor: 0.9,
      skorAkademik: 0.9,
      skorKehadiran: 0.95,
      skorSikap: 0.9,
      batas: { intervalBerisikoBawah: 0 },
      detail: { ringkasanMapel: [{ nama: 'IPA', rata: 75, jumlah: 1 }] }
    }
    const ketat = rekomendasiUntuk({
      ...hasil,
      ambang: { ...AMBANG_REKOMENDASI, kkmMapel: 80, ambangUnggul: 90 }
    })
    assert.ok(ketat.daftar.some((d) => /IPA/.test(d) && /KKM 80/.test(d)))

    const bawaan = rekomendasiUntuk({
      ...hasil,
      ambang: { ...AMBANG_REKOMENDASI, ...AMBANG_MAPEL }
    })
    assert.ok(!bawaan.daftar.some((d) => /IPA/.test(d)))
  })

  test('skor di bawah intervalBerisikoBawah menambah prioritas tanpa mengubah kategori', () => {
    const interval = { intervalBaikBawah: 0.67, intervalPerhatianBawah: 0.34, intervalBerisikoBawah: 0.6 }
    assert.equal(kategoriDariSkor(0.5, interval).kode, 'perhatian')

    const r = rekomendasiUntuk({
      abk: false,
      lengkap: true,
      skor: 0.5,
      skorAkademik: 0.9,
      skorKehadiran: 0.9,
      skorSikap: 0.9,
      ambang: { ...AMBANG_REKOMENDASI, ...AMBANG_MAPEL },
      batas: { intervalBerisikoBawah: 0.6 }
    })
    assert.equal(r.daftar[0], 'Prioritaskan tindak lanjut intensif (skor di bawah batas berisiko).')
  })
})

describe('rentangSemester', () => {
  test('memakai rentang Kaldik Jateng 2025/2026 sebagai bawaan', () => {
    assert.deepEqual(rentangSemester(null), { mulai: '2025-07-14', akhir: '2025-12-21' })
    assert.deepEqual(rentangSemester({ semesterAktif: 'Genap' }), { mulai: '2026-01-05', akhir: '2026-06-21' })
  })

  test('memakai rentang yang disimpan admin', () => {
    const ta = {
      semesterAktif: 'Genap',
      ganjilMulai: '2025-07-14',
      ganjilAkhir: '2025-12-21',
      genapMulai: '2026-01-06',
      genapAkhir: '2026-06-19'
    }
    assert.deepEqual(rentangSemester(ta), { mulai: '2026-01-06', akhir: '2026-06-19' })
    assert.deepEqual(rentangSemester({ ...ta, semesterAktif: 'Ganjil' }), { mulai: '2025-07-14', akhir: '2025-12-21' })
  })

  test('rentang eksplisit dipakai untuk label tanpa mencampur periode lain', () => {
    const ta = { semesterAktif: 'Ganjil' }
    const rentang = { mulai: '2025-10-01', akhir: '2025-10-15' }
    assert.equal(labelPeriode(ta, rentang), '2025-10-01 s/d 2025-10-15')
    assert.match(labelPeriode(ta), /Semester Ganjil \(2025-07-14 s\/d 2025-12-21\)/)
  })
})
