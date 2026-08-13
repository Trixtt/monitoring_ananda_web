import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Artikel = sequelize.define(
  'Artikel',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    kategori: { type: DataTypes.ENUM('Prestasi', 'Kegiatan', 'Pengumuman'), defaultValue: 'Kegiatan' },
    gambar: { type: DataTypes.STRING, allowNull: true },
    isi: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'publish'), defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true }
  },
  { tableName: 'artikel' }
)

export default Artikel
