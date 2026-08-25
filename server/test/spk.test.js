import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSikap,
  kategoriDariSkor,
  hasilAbk,
  hitungSkorData,
  agregasiMapel,
  rekomendasiUntuk
} from '../src/services/spk.js'

const setting = {
  intervalBaikBawah: 0.8,
  intervalPerhatianBawah: 0.6,
  bobotAkademik: 0.5,
  bobotKehadiran: 0.3,
  bobotSikap: 0.2
}

describe('normalizeSikap', () => {
  test('skala 4 menjadi proporsi 0-1', () => {
    assert.equal(normalizeSikap(4), 1)
    assert.equal(normalizeSikap(2), 0.5)
    assert.equal(normalizeSikap(0), 0)
  })
})

describe('kategoriDariSkor', () => {
  test('batas bawah aman termasuk aman', () => {
    assert.equal(kategoriDariSkor(0.8, setting).kode, 'aman')
  })
  test('di bawah aman masuk perhatian', () => {
    assert.equal(kategoriDariSkor(0.79, setting).kode, 'perhatian')
  })
  test('batas bawah perhatian termasuk perhatian', () => {
    assert.equal(kategoriDariSkor(0.6, setting).kode, 'perhatian')
  })
  test('di bawah perhatian masuk berisiko', () => {
    assert.equal(kategoriDariSkor(0.59, setting).kode, 'berisiko')
  })
})

describe('hasilAbk', () => {
  test('skor null dan kategori abk', () => {
    const h = hasilAbk(7)
    assert.equal(h.siswaId, 7)
    assert.equal(h.abk, true)
    assert.equal(h.skor, null)
    assert.equal(h.kategori.kode, 'abk')
  })
})

describe('hitungSkorData', () => {
  test('data kosong menghasilkan skor nol dan berisiko', () => {
    const h = hitungSkorData({}, setting)
    assert.equal(h.skor, 0)
    assert.equal(h.kategori.kode, 'berisiko')
    assert.deepEqual(h.detail, { rataNilai: 0, totalHari: 0, jumlahHadir: 0, rataSikap: 0 })
  })

  test('rumus tertimbang dan pembulatan 4 desimal', () => {
    const h = hitungSkorData(
      {
        nilaiAngka: [80, 90],
        hadirStatus: ['hadir', 'hadir', 'alfa'],
        sikapAngka: [3, 4]
      },
      setting
    )
    // akademik 0.85 * 0.5 + kehadiran 0.6667 * 0.3 + sikap 0.875 * 0.2 = 0.8
    assert.equal(h.skorAkademik, 0.85)
    assert.equal(h.skorKehadiran, Number((2 / 3).toFixed(4)))
    assert.equal(h.skorSikap, 0.875)
    assert.equal(h.skor, 0.8)
    assert.deepEqual(h.detail, { rataNilai: 85, totalHari: 3, jumlahHadir: 2, rataSikap: 3.5 })
  })

  test('semua nilai sempurna menghasilkan skor 1 dan aman', () => {
    const h = hitungSkorData(
      { nilaiAngka: [100], hadirStatus: ['hadir'], sikapAngka: [4] },
      setting
    )
    assert.equal(h.skor, 1)
    assert.equal(h.kategori.kode, 'aman')
  })

  test('status kehadiran selain hadir tidak dihitung hadir', () => {
    const h = hitungSkorData(
      { nilaiAngka: [], hadirStatus: ['izin', 'sakit', 'alfa', 'hadir'], sikapAngka: [] },
      setting
    )
    assert.equal(h.detail.jumlahHadir, 1)
    assert.equal(h.detail.totalHari, 4)
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

  test('kehadiran rendah sendirian memberi tipe kehadiran', () => {
    const r = rekomendasiUntuk({ abk: false, skorAkademik: 0.9, skorKehadiran: 0.5, skorSikap: 0.9 })
    assert.equal(r.tipe, 'kehadiran')
    assert.ok(r.daftar.length >= 2)
  })

  test('akademik rendah memunculkan fokus mapel terlemah', () => {
    const r = rekomendasiUntuk({ abk: false, skorAkademik: 0.4, skorKehadiran: 0.95, skorSikap: 0.9 }, 'IPA')
    assert.equal(r.tipe, 'akademik')
    assert.ok(r.daftar.some((d) => d.includes('IPA')))
  })

  test('sikap rendah memberi tipe sikap', () => {
    const r = rekomendasiUntuk({ abk: false, skorAkademik: 0.9, skorKehadiran: 0.95, skorSikap: 0.3 })
    assert.equal(r.tipe, 'sikap')
  })

  test('semua baik memberi pesan pertahankan', () => {
    const r = rekomendasiUntuk({ abk: false, skorAkademik: 0.9, skorKehadiran: 0.95, skorSikap: 0.9 })
    assert.equal(r.tipe, 'baik')
    assert.match(r.pesan, /pertahankan/)
  })

  test('akademik dan sikap sama-sama rendah: sikap menang karena dievaluasi terakhir', () => {
    const r = rekomendasiUntuk({ abk: false, skorAkademik: 0.4, skorKehadiran: 0.95, skorSikap: 0.3 })
    assert.equal(r.tipe, 'sikap')
    assert.ok(r.daftar.length >= 3)
    assert.ok(r.daftar.some((d) => d.includes('bimbingan')))
  })
})
