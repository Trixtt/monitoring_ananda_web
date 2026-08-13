import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Sikap = sequelize.define(
  'Sikap',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jenis: { type: DataTypes.ENUM('spiritual', 'sosial'), allowNull: false },
    nilai: { type: DataTypes.INTEGER, allowNull: false },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
  },
  { tableName: 'sikap' }
)

export default Sikap
