import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Siswa = sequelize.define(
  'Siswa',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nisn: { type: DataTypes.STRING, unique: true, allowNull: false },
    nama: { type: DataTypes.STRING, allowNull: false },
    jenisKelamin: { type: DataTypes.ENUM('L', 'P'), allowNull: true },
    tanggalLahir: { type: DataTypes.DATEONLY, allowNull: true },
    tahunAngkatan: { type: DataTypes.INTEGER, allowNull: true },
    nomorAbsen: { type: DataTypes.INTEGER, allowNull: true },
    statusABK: { type: DataTypes.BOOLEAN, defaultValue: false },
    catatanABK: { type: DataTypes.TEXT, allowNull: true }
  },
  { tableName: 'siswa' }
)

export default Siswa
