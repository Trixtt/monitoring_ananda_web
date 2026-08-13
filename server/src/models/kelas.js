import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Kelas = sequelize.define(
  'Kelas',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    tingkat: { type: DataTypes.INTEGER, allowNull: false },
    waliKelas: { type: DataTypes.STRING, allowNull: true }
  },
  { tableName: 'kelas' }
)

export default Kelas
