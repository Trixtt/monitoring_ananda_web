'use strict'

const { DataTypes } = require('sequelize')

// Rulebase rekomendasi per mata pelajaran:
// - kkmMapel: batas bawah rata-rata mapel (default 70, skala 0-100)
// - ambangUnggul: batas rata-rata mapel yang dianggap unggul (default 85)
// Migrasi sebelumnya tidak dijalankan ulang; kolom lama tetap dipertahankan.

const KOLOM_SETTING_SPK = {
  kkmMapel: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 70 },
  ambangUnggul: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 85 }
}

const NILAI_AWAL = {
  kkmMapel: 70,
  ambangUnggul: 85
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
    await tambahKolom(queryInterface, 'setting_spk', KOLOM_SETTING_SPK)
    await queryInterface.bulkUpdate('setting_spk', NILAI_AWAL, {})
  },

  async down(queryInterface) {
    await hapusKolom(queryInterface, 'setting_spk', KOLOM_SETTING_SPK)
  }
}
