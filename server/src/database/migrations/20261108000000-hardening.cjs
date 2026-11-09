'use strict'

const INDEX = [
  ['nilai', ['siswaId', 'tahunAjaranId'], 'nilai_siswa_ta_idx', false],
  ['kehadiran', ['siswaId', 'tahunAjaranId'], 'kehadiran_siswa_ta_idx', false],
  ['sikap', ['siswaId', 'tahunAjaranId'], 'sikap_siswa_ta_idx', false],
  ['users', ['role', 'kelasId'], 'users_role_kelas_idx', false],
  ['siswa', ['kelasId', 'tahunAjaranId'], 'siswa_kelas_ta_idx', false],
  ['artikel', ['status', 'publishedAt'], 'artikel_status_published_idx', false],
  ['notifikasi', ['userId', 'isRead'], 'notifikasi_user_read_idx', false],
  ['laporan', ['userId', 'createdAt'], 'laporan_user_created_idx', false]
]

async function adaTabel(queryInterface, nama) {
  const tabel = await queryInterface.showAllTables()
  return tabel
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .some((t) => String(t).toLowerCase() === nama.toLowerCase())
}

async function adaIndex(queryInterface, tabel, nama) {
  try {
    const indexes = await queryInterface.showIndex(tabel)
    return indexes.some((i) => i.name === nama)
  } catch {
    return false
  }
}

async function tambahIndex(queryInterface, tabel, kolom, nama, unik = false) {
  if (await adaIndex(queryInterface, tabel, nama)) return
  await queryInterface.addIndex(tabel, kolom, { name: nama, unique: unik })
}

async function up(queryInterface, DataTypes) {
  const dialect = queryInterface.sequelize.getDialect()

  if (!(await adaTabel(queryInterface, 'audit_logs'))) {
    await queryInterface.createTable('audit_logs', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      actorId: { type: DataTypes.INTEGER, allowNull: true },
      actorName: { type: DataTypes.STRING, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false },
      entity: { type: DataTypes.STRING, allowNull: true },
      entityId: { type: DataTypes.STRING, allowNull: true },
      detail: { type: DataTypes.TEXT, allowNull: true },
      ip: { type: DataTypes.STRING, allowNull: true },
      userAgent: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    })
  }

  // Bersihkan duplikat kehadiran sebelum memasang unique index.
  if (dialect === 'mysql') {
    await queryInterface.sequelize.query(
      'DELETE k1 FROM kehadiran k1 INNER JOIN kehadiran k2 ON k1.siswaId = k2.siswaId AND k1.tanggal = k2.tanggal AND k1.id < k2.id'
    )
  } else if (dialect === 'sqlite') {
    await queryInterface.sequelize.query(
      'DELETE FROM kehadiran WHERE id NOT IN (SELECT MAX(id) FROM kehadiran GROUP BY siswaId, tanggal)'
    )
  }

  await tambahIndex(queryInterface, 'kehadiran', ['siswaId', 'tanggal'], 'kehadiran_siswa_tanggal_unique', true)

  for (const [tabel, kolom, nama, unik] of INDEX) {
    await tambahIndex(queryInterface, tabel, kolom, nama, unik)
  }

  await tambahIndex(queryInterface, 'audit_logs', ['actorId'], 'audit_logs_actor_idx')
  await tambahIndex(queryInterface, 'audit_logs', ['createdAt'], 'audit_logs_created_idx')

  // Tambahkan kategori Tips agar sesuai dengan UI dan controller.
  if (dialect === 'mysql') {
    await queryInterface.sequelize.query(
      "ALTER TABLE artikel MODIFY kategori ENUM('Prestasi','Kegiatan','Pengumuman','Tips') NOT NULL DEFAULT 'Kegiatan'"
    )
  }
}

async function down(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect()

  const daftarIndex = [
    ['kehadiran', 'kehadiran_siswa_tanggal_unique'],
    ...INDEX.map(([tabel, , nama]) => [tabel, nama]),
    ['audit_logs', 'audit_logs_actor_idx'],
    ['audit_logs', 'audit_logs_created_idx']
  ]
  for (const [tabel, nama] of daftarIndex) {
    if (await adaIndex(queryInterface, tabel, nama)) {
      await queryInterface.removeIndex(tabel, nama)
    }
  }

  if (await adaTabel(queryInterface, 'audit_logs')) {
    await queryInterface.dropTable('audit_logs')
  }

  if (dialect === 'mysql') {
    await queryInterface.sequelize.query(
      "ALTER TABLE artikel MODIFY kategori ENUM('Prestasi','Kegiatan','Pengumuman') NOT NULL DEFAULT 'Kegiatan'"
    )
  }
}

module.exports = { up, down }
