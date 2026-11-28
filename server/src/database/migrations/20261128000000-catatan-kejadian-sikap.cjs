'use strict'

const { DataTypes } = require('sequelize')

// Revisi v1.1: tabel sikap dipakai sebagai catatan kejadian.
// Kolom nilai 1-5 dihapus; kategori, pengurangan, guruId, dan kehadiranId
// ditambahkan. Hanya baris demo pada tabel sikap yang dibersihkan. Tabel dan
// data lain tidak disentuh.
//
// SQLite tidak mendukung ALTER TABLE ADD CONSTRAINT. Karena itu untuk SQLite
// tabel sikap dibangun ulang secara eksplisit dengan seluruh index dan foreign
// key yang harus dipertahankan. Untuk MySQL perubahan dilakukan inkremental.
//
// DOWN hanya mengembalikan struktur lama. Isi data demo sikap yang dihapus
// TIDAK dapat dipulihkan; backup wajib dibuat sebelum migration dijalankan.

const NAMA_TABEL = 'sikap'
const INDEX_LAMA = 'sikap_siswa_ta_idx'
const INDEX_UNIK_BOLOS = 'sikap_kehadiran_unik'
const FK_GURU = 'sikap_guruId_fk'
const FK_KEHADIRAN = 'sikap_kehadiranId_fk'

const REF_SISWA = { model: 'siswa', key: 'id' }
const REF_TAHUN_AJARAN = { model: 'tahun_ajaran', key: 'id' }
const REF_GURU = { model: 'users', key: 'id' }
const REF_KEHADIRAN = { model: 'kehadiran', key: 'id' }

function kolomSiswa() {
  return { type: DataTypes.INTEGER, references: REF_SISWA, onUpdate: 'CASCADE', onDelete: 'CASCADE' }
}

function kolomTahunAjaran() {
  return { type: DataTypes.INTEGER, references: REF_TAHUN_AJARAN, onUpdate: 'CASCADE', onDelete: 'SET NULL' }
}

function strukturBaru() {
  return {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jenis: { type: DataTypes.ENUM('spiritual', 'sosial'), allowNull: false },
    kategori: { type: DataTypes.STRING(100), allowNull: false },
    pengurangan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: true },
    siswaId: kolomSiswa(),
    tahunAjaranId: kolomTahunAjaran(),
    guruId: {
      type: DataTypes.INTEGER,
      references: REF_GURU,
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    kehadiranId: {
      type: DataTypes.INTEGER,
      references: REF_KEHADIRAN,
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  }
}

function strukturLama() {
  return {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jenis: { type: DataTypes.ENUM('spiritual', 'sosial'), allowNull: false },
    nilai: { type: DataTypes.INTEGER, allowNull: false },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: true },
    siswaId: kolomSiswa(),
    tahunAjaranId: kolomTahunAjaran(),
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  }
}

async function bangunUlang(queryInterface, struktur, pakaiKehadiran) {
  await queryInterface.dropTable(NAMA_TABEL)
  await queryInterface.createTable(NAMA_TABEL, struktur)
  await queryInterface.addIndex(NAMA_TABEL, ['siswaId', 'tahunAjaranId'], { name: INDEX_LAMA })
  if (pakaiKehadiran) {
    await queryInterface.addIndex(NAMA_TABEL, ['kehadiranId'], { name: INDEX_UNIK_BOLOS, unique: true })
  }
}

async function hapusIndexJikaAda(queryInterface, nama) {
  const daftar = await queryInterface.showIndex(NAMA_TABEL)
  if (daftar.some((i) => i.name === nama)) {
    await queryInterface.removeIndex(NAMA_TABEL, nama)
  }
}

async function hapusConstraintJikaAda(queryInterface, nama) {
  try {
    await queryInterface.removeConstraint(NAMA_TABEL, nama)
  } catch (error) {
    // Constraint belum ada pada database yang masih memakai struktur lama.
    const kode = error?.original?.errno ?? error?.original?.code
    if (kode !== 1091 && kode !== 'ER_CANT_DROP_FIELD_OR_KEY') throw error
  }
}

async function up(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect()

  if (dialect === 'sqlite') {
    // Data lama pada tabel ini sudah dikonfirmasi sebagai data demo. Drop table
    // hanya menghapus baris sikap; tabel lain tidak dirujuk maupun dihapus.
    await bangunUlang(queryInterface, strukturBaru(), true)
    return
  }

  // MySQL: kosongkan hanya baris demo sikap sebelum menambah kolom NOT NULL.
  await queryInterface.bulkDelete(NAMA_TABEL, {}, {})
  await hapusIndexJikaAda(queryInterface, INDEX_UNIK_BOLOS)

  await queryInterface.addColumn(NAMA_TABEL, 'kategori', {
    type: DataTypes.STRING(100),
    allowNull: false
  })
  await queryInterface.addColumn(NAMA_TABEL, 'pengurangan', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  await queryInterface.addColumn(NAMA_TABEL, 'guruId', { type: DataTypes.INTEGER, allowNull: true })
  await queryInterface.addColumn(NAMA_TABEL, 'kehadiranId', { type: DataTypes.INTEGER, allowNull: true })

  await queryInterface.addConstraint(NAMA_TABEL, {
    fields: ['guruId'],
    type: 'foreign key',
    name: FK_GURU,
    references: { table: REF_GURU.model, field: REF_GURU.key },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  await queryInterface.addConstraint(NAMA_TABEL, {
    fields: ['kehadiranId'],
    type: 'foreign key',
    name: FK_KEHADIRAN,
    references: { table: REF_KEHADIRAN.model, field: REF_KEHADIRAN.key },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  await queryInterface.addIndex(NAMA_TABEL, ['kehadiranId'], { name: INDEX_UNIK_BOLOS, unique: true })
  await queryInterface.removeColumn(NAMA_TABEL, 'nilai')
}

async function down(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect()

  if (dialect === 'sqlite') {
    await bangunUlang(queryInterface, strukturLama(), false)
    return
  }

  await hapusConstraintJikaAda(queryInterface, FK_GURU)
  await hapusConstraintJikaAda(queryInterface, FK_KEHADIRAN)
  await hapusIndexJikaAda(queryInterface, INDEX_UNIK_BOLOS)

  await queryInterface.removeColumn(NAMA_TABEL, 'guruId')
  await queryInterface.removeColumn(NAMA_TABEL, 'kehadiranId')
  await queryInterface.removeColumn(NAMA_TABEL, 'kategori')
  await queryInterface.removeColumn(NAMA_TABEL, 'pengurangan')
  await queryInterface.addColumn(NAMA_TABEL, 'nilai', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
}

module.exports = { up, down }
