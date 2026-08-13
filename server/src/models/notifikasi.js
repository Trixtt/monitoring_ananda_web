import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Notifikasi = sequelize.define(
  'Notifikasi',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    pesan: { type: DataTypes.TEXT, allowNull: false },
    tipe: { type: DataTypes.ENUM('nilai', 'kehadiran', 'sikap', 'sistem'), defaultValue: 'sistem' },
    link: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { tableName: 'notifikasi' }
)

export default Notifikasi
