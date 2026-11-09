import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { bisaAksesSiswa, validasiSiswaDalamKelas } from '../src/services/aksesKelas.js'

describe('bisaAksesSiswa', () => {
  test('admin boleh mengakses siswa mana pun', () => {
    assert.equal(bisaAksesSiswa({ role: 'admin' }, { kelasId: 3 }), true)
  })

  test('wali kelas hanya boleh mengakses siswa di kelasnya', () => {
    const wali = { role: 'wali_kelas', kelasId: 2 }
    assert.equal(bisaAksesSiswa(wali, { kelasId: 2 }), true)
    assert.equal(bisaAksesSiswa(wali, { kelasId: 3 }), false)
  })

  test('wali tanpa kelas atau siswa tanpa kelas ditolak', () => {
    assert.equal(bisaAksesSiswa({ role: 'wali_kelas', kelasId: null }, { kelasId: 2 }), false)
    assert.equal(bisaAksesSiswa({ role: 'wali_kelas', kelasId: 2 }, { kelasId: null }), false)
  })

  test('input kosong ditolak', () => {
    assert.equal(bisaAksesSiswa(null, { kelasId: 2 }), false)
    assert.equal(bisaAksesSiswa({ role: 'admin' }, null), false)
  })
})

describe('validasiSiswaDalamKelas', () => {
  test('daftar kosong tidak menyentuh database', async () => {
    const hasil = await validasiSiswaDalamKelas({ role: 'wali_kelas', kelasId: 2 }, [])
    assert.deepEqual(hasil, { rows: [] })
  })
})
