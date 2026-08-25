'use strict'

const tabel = {
  kelas: 'kelas',
  users: 'users',
  siswa: 'siswa',
  tahunAjaran: 'tahun_ajaran',
  nilai: 'nilai',
  kehadiran: 'kehadiran',
  sikap: 'sikap',
  artikel: 'artikel',
  notifikasi: 'notifikasi',
  laporan: 'laporan',
  settingSpk: 'setting_spk',
  mapel: 'mapel'
}

async function up(queryInterface, DataTypes) {
  await queryInterface.createTable(tabel.tahunAjaran, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.kelas, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    tingkat: { type: DataTypes.INTEGER, allowNull: false },
    waliKelas: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.siswa, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nisn: { type: DataTypes.STRING, unique: true, allowNull: false },
    nama: { type: DataTypes.STRING, allowNull: false },
    jenisKelamin: { type: DataTypes.ENUM('L', 'P'), allowNull: true },
    tanggalLahir: { type: DataTypes.DATEONLY, allowNull: true },
    tahunAngkatan: { type: DataTypes.INTEGER, allowNull: true },
    nomorAbsen: { type: DataTypes.INTEGER, allowNull: true },
    statusABK: { type: DataTypes.BOOLEAN, defaultValue: false },
    catatanABK: { type: DataTypes.TEXT, allowNull: true },
    kelasId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.kelas, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    tahunAjaranId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.tahunAjaran, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.users, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'wali_kelas', 'kepala_sekolah', 'orang_tua'),
      allowNull: false
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    photo: { type: DataTypes.STRING, allowNull: true },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    kelasId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.kelas, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    siswaId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.siswa, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.mapel, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, unique: true, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.nilai, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    nilai: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: true },
    siswaId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.siswa, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    mapelId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.mapel, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    tahunAjaranId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.tahunAjaran, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.kehadiran, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM('hadir', 'izin', 'sakit', 'alpa'),
      allowNull: false
    },
    keterangan: { type: DataTypes.STRING, allowNull: true },
    siswaId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.siswa, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    tahunAjaranId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.tahunAjaran, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.sikap, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jenis: { type: DataTypes.ENUM('spiritual', 'sosial'), allowNull: false },
    nilai: { type: DataTypes.INTEGER, allowNull: false },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: true },
    siswaId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.siswa, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    tahunAjaranId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.tahunAjaran, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.artikel, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    kategori: {
      type: DataTypes.ENUM('Prestasi', 'Kegiatan', 'Pengumuman'),
      defaultValue: 'Kegiatan'
    },
    gambar: { type: DataTypes.STRING, allowNull: true },
    isi: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'publish'), defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    authorId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.users, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.notifikasi, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    pesan: { type: DataTypes.TEXT, allowNull: false },
    tipe: {
      type: DataTypes.ENUM('nilai', 'kehadiran', 'sikap', 'sistem'),
      defaultValue: 'sistem'
    },
    link: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    userId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.users, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.laporan, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    kelasId: { type: DataTypes.INTEGER, allowNull: true },
    kelasNama: { type: DataTypes.STRING, allowNull: true },
    kategori: { type: DataTypes.STRING, allowNull: true },
    tanggalMulai: { type: DataTypes.DATEONLY, allowNull: true },
    tanggalAkhir: { type: DataTypes.DATEONLY, allowNull: true },
    jumlah: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isi: { type: DataTypes.TEXT, allowNull: false },
    userId: {
      type: DataTypes.INTEGER,
      references: { model: tabel.users, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })

  await queryInterface.createTable(tabel.settingSpk, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bobotAkademik: { type: DataTypes.FLOAT, defaultValue: 0.31 },
    bobotKehadiran: { type: DataTypes.FLOAT, defaultValue: 0.31 },
    bobotSikap: { type: DataTypes.FLOAT, defaultValue: 0.38 },
    intervalBaikBawah: { type: DataTypes.FLOAT, defaultValue: 0.67 },
    intervalPerhatianBawah: { type: DataTypes.FLOAT, defaultValue: 0.34 },
    intervalBerisikoBawah: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  })
}

async function down(queryInterface) {
  const urutan = [
    tabel.settingSpk,
    tabel.laporan,
    tabel.notifikasi,
    tabel.artikel,
    tabel.sikap,
    tabel.kehadiran,
    tabel.nilai,
    tabel.mapel,
    tabel.users,
    tabel.siswa,
    tabel.kelas,
    tabel.tahunAjaran
  ]
  for (const t of urutan) {
    await queryInterface.dropTable(t)
  }
}

module.exports = { up, down }
