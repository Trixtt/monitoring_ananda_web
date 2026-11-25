'use strict'

// Tahap 1: samakan bobot SAW yang tersimpan dengan rasio presisi 4:4:5.
// Tidak ada perubahan skema: kolom nilai sikap sudah INTEGER (mendukung 1-5)
// dan unique index kehadiran(siswaId, tanggal) sudah dipasang migrasi sebelumnya.

const BOBOT = {
  bobotAkademik: 4 / 13,
  bobotKehadiran: 4 / 13,
  bobotSikap: 5 / 13
}

const BOBOT_LAMA = {
  bobotAkademik: 0.31,
  bobotKehadiran: 0.31,
  bobotSikap: 0.38
}

async function adaTabel(queryInterface) {
  const tabel = await queryInterface.showAllTables()
  return tabel
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .some((t) => String(t).toLowerCase() === 'setting_spk')
}

async function ubahBobot(queryInterface, nilai) {
  if (!(await adaTabel(queryInterface))) return
  const [rows] = await queryInterface.sequelize.query('SELECT id FROM setting_spk')
  for (const row of rows) {
    await queryInterface.bulkUpdate('setting_spk', nilai, { id: row.id })
  }
}

module.exports = {
  async up(queryInterface) {
    await ubahBobot(queryInterface, BOBOT)
  },

  async down(queryInterface) {
    await ubahBobot(queryInterface, BOBOT_LAMA)
  }
}
