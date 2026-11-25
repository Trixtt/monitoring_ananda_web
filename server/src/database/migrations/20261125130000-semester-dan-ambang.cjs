'use strict'

const { DataTypes } = require('sequelize')

// Revisi akhir Tahap 1:
// - tahun ajaran menyimpan semester aktif dan rentang ganjil/genap (Kaldik Jateng 2025/2026)
// - setting SPK menyimpan ambang rekomendasi yang dapat diatur admin
// Kolom lama tidak dihapus; down hanya menghapus kolom baru ini.

const SEMESTER_AWAL = {
  semesterAktif: 'Ganjil',
  ganjilMulai: '2025-07-14',
  ganjilAkhir: '2025-12-21',
  genapMulai: '2026-01-05',
  genapAkhir: '2026-06-21'
}

const AMBANG_AWAL = {
  ambangAkademik: 0.65,
  ambangSikap: 0.65,
  ambangKehadiran: 0.8
}

const KOLOM_TAHUN_AJARAN = {
  semesterAktif: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'Ganjil' },
  ganjilMulai: { type: DataTypes.DATEONLY, allowNull: true },
  ganjilAkhir: { type: DataTypes.DATEONLY, allowNull: true },
  genapMulai: { type: DataTypes.DATEONLY, allowNull: true },
  genapAkhir: { type: DataTypes.DATEONLY, allowNull: true }
}

const KOLOM_SETTING_SPK = {
  ambangAkademik: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.65 },
  ambangSikap: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.65 },
  ambangKehadiran: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.8 }
}

async function adaTabel(queryInterface, namaTabel) {
  const daftar = await queryInterface.showAllTables()
  return daftar
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .some((t) => String(t).toLowerCase() === namaTabel)
}

async function tambahKolom(queryInterface, namaTabel, definisi) {
  if (!(await adaTabel(queryInterface, namaTabel))) return
  const struktur = await queryInterface.describeTable(namaTabel)
  for (const [nama, kolom] of Object.entries(definisi)) {
    if (!struktur[nama]) await queryInterface.addColumn(namaTabel, nama, kolom)
  }
}

async function hapusKolom(queryInterface, namaTabel, definisi) {
  if (!(await adaTabel(queryInterface, namaTabel))) return
  const struktur = await queryInterface.describeTable(namaTabel)
  for (const nama of Object.keys(definisi)) {
    if (struktur[nama]) await queryInterface.removeColumn(namaTabel, nama)
  }
}

module.exports = {
  async up(queryInterface) {
    await tambahKolom(queryInterface, 'tahun_ajaran', KOLOM_TAHUN_AJARAN)
    await tambahKolom(queryInterface, 'setting_spk', KOLOM_SETTING_SPK)

    await queryInterface.bulkUpdate('tahun_ajaran', SEMESTER_AWAL, { nama: '2025/2026' })
    await queryInterface.bulkUpdate('setting_spk', AMBANG_AWAL, {})
  },

  async down(queryInterface) {
    await hapusKolom(queryInterface, 'setting_spk', KOLOM_SETTING_SPK)
    await hapusKolom(queryInterface, 'tahun_ajaran', KOLOM_TAHUN_AJARAN)
  }
}
