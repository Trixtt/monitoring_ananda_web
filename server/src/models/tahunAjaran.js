import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const TahunAjaran = sequelize.define(
  'TahunAjaran',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { tableName: 'tahun_ajaran' }
)

export default TahunAjaran
