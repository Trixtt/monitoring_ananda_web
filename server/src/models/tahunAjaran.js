import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const TahunAjaran = sequelize.define(
  'TahunAjaran',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    semesterAktif: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'Ganjil' },
    ganjilMulai: { type: DataTypes.DATEONLY, allowNull: true },
    ganjilAkhir: { type: DataTypes.DATEONLY, allowNull: true },
    genapMulai: { type: DataTypes.DATEONLY, allowNull: true },
    genapAkhir: { type: DataTypes.DATEONLY, allowNull: true }
  },
  { tableName: 'tahun_ajaran' }
)

export default TahunAjaran
