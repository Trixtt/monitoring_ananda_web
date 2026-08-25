import sequelize from '../config/database.js'
import User from './user.js'
import Kelas from './kelas.js'
import TahunAjaran from './tahunAjaran.js'
import Siswa from './siswa.js'
import Mapel from './mapel.js'
import Nilai from './nilai.js'
import Kehadiran from './kehadiran.js'
import Sikap from './sikap.js'
import Artikel from './artikel.js'
import SettingSpk from './settingSpk.js'
import Notifikasi from './notifikasi.js'
import Laporan from './laporan.js'

// User
User.belongsTo(Kelas, { as: 'kelas', foreignKey: 'kelasId' })
User.belongsTo(Siswa, { as: 'siswa', foreignKey: 'siswaId' })

// Siswa
Siswa.belongsTo(Kelas, { as: 'kelas', foreignKey: 'kelasId' })
Siswa.belongsTo(TahunAjaran, { as: 'tahunAjaran', foreignKey: 'tahunAjaranId' })
Siswa.hasMany(User, { as: 'users', foreignKey: 'siswaId' })

// Kelas
Kelas.hasMany(Siswa, { as: 'siswa', foreignKey: 'kelasId' })
Kelas.hasMany(User, { as: 'users', foreignKey: 'kelasId' })

// TahunAjaran
TahunAjaran.hasMany(Siswa, { as: 'siswa', foreignKey: 'tahunAjaranId' })

// Nilai
Nilai.belongsTo(Siswa, { as: 'siswa', foreignKey: 'siswaId' })
Nilai.belongsTo(Mapel, { as: 'mapel', foreignKey: 'mapelId' })
Nilai.belongsTo(TahunAjaran, { as: 'tahunAjaran', foreignKey: 'tahunAjaranId' })
Siswa.hasMany(Nilai, { as: 'nilai', foreignKey: 'siswaId' })
Mapel.hasMany(Nilai, { as: 'nilai', foreignKey: 'mapelId' })

// Kehadiran
Kehadiran.belongsTo(Siswa, { as: 'siswa', foreignKey: 'siswaId' })
Kehadiran.belongsTo(TahunAjaran, { as: 'tahunAjaran', foreignKey: 'tahunAjaranId' })
Siswa.hasMany(Kehadiran, { as: 'kehadiran', foreignKey: 'siswaId' })

// Sikap
Sikap.belongsTo(Siswa, { as: 'siswa', foreignKey: 'siswaId' })
Sikap.belongsTo(TahunAjaran, { as: 'tahunAjaran', foreignKey: 'tahunAjaranId' })
Siswa.hasMany(Sikap, { as: 'sikap', foreignKey: 'siswaId' })

// Artikel
Artikel.belongsTo(User, { as: 'author', foreignKey: 'authorId' })

// Notifikasi
Notifikasi.belongsTo(User, { as: 'user', foreignKey: 'userId' })
User.hasMany(Notifikasi, { as: 'notifikasi', foreignKey: 'userId' })

// Laporan
Laporan.belongsTo(User, { as: 'dibuatOleh', foreignKey: 'userId' })
User.hasMany(Laporan, { as: 'laporan', foreignKey: 'userId' })

export async function initDb() {
  // DB_SYNC=none -> lewati sync (skema dikelola migrasi sequelize-cli)
  if (process.env.DB_SYNC !== 'none') {
    await sequelize.sync()
  }
  return sequelize
}

export {
  sequelize,
  User,
  Kelas,
  TahunAjaran,
  Siswa,
  Mapel,
  Nilai,
  Kehadiran,
  Sikap,
  Artikel,
  SettingSpk,
  Notifikasi,
  Laporan
}
