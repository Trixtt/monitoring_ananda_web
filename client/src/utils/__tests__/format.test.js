import { describe, it, expect } from 'vitest'
import {
  formatSkor,
  persen,
  kategoriInfo,
  formatTanggal,
  namaKelasSingkat,
  labelSikap
} from '../format'

describe('formatSkor', () => {
  it('mengubah skor 0-1 menjadi angka 0-100 satu desimal', () => {
    expect(formatSkor(0.8)).toBe('80.0')
    expect(formatSkor(0.12345)).toBe('12.3')
    expect(formatSkor(1)).toBe('100.0')
    expect(formatSkor(0)).toBe('0.0')
  })

  it('null/undefined menjadi tanda strip', () => {
    expect(formatSkor(null)).toBe('-')
    expect(formatSkor(undefined)).toBe('-')
  })
})

describe('persen', () => {
  it('membulatkan proporsi ke persen', () => {
    expect(persen(0.6667)).toBe('67%')
    expect(persen(0)).toBe('0%')
    expect(persen(1)).toBe('100%')
  })

  it('null/undefined menjadi 0%', () => {
    expect(persen(null)).toBe('0%')
    expect(persen(undefined)).toBe('0%')
  })
})

describe('kategoriInfo', () => {
  it('kode dikenal mengembalikan kategori sesuai', () => {
    expect(kategoriInfo('aman').label).toBe('Baik / Aman')
    expect(kategoriInfo('perhatian').label).toBe('Perlu Perhatian')
    expect(kategoriInfo('berisiko').label).toBe('Berisiko')
    expect(kategoriInfo('abk').label).toBe('ABK')
  })

  it('kode tidak dikenal jatuh ke aman', () => {
    expect(kategoriInfo('tidak_ada')).toEqual(kategoriInfo('aman'))
  })
})

describe('namaKelasSingkat', () => {
  it('menghapus awalan Kelas', () => {
    expect(namaKelasSingkat('Kelas 1')).toBe('1')
    expect(namaKelasSingkat('KELAS 4A')).toBe('4A')
    expect(namaKelasSingkat('kelas 6b')).toBe('6b')
  })

  it('nama tanpa awalan tetap utuh', () => {
    expect(namaKelasSingkat('VI-B')).toBe('VI-B')
  })

  it('kosong/null menjadi strip', () => {
    expect(namaKelasSingkat(null)).toBe('-')
    expect(namaKelasSingkat('')).toBe('-')
  })
})

describe('formatTanggal', () => {
  it('nilai kosong menjadi strip', () => {
    expect(formatTanggal(null)).toBe('-')
    expect(formatTanggal('')).toBe('-')
  })

  it('memuat komponen tanggal bahasa Indonesia', () => {
    const hasil = formatTanggal('2026-08-17')
    expect(hasil).toMatch(/2026/)
    expect(hasil).not.toBe('-')
  })
})

describe('labelSikap', () => {
  it('skala 1-4 lengkap', () => {
    expect(labelSikap[1]).toBe('Kurang')
    expect(labelSikap[2]).toBe('Cukup')
    expect(labelSikap[3]).toBe('Baik')
    expect(labelSikap[4]).toBe('Sangat Baik')
  })
})
