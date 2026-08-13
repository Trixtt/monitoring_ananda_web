import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Nilai = sequelize.define(
  'Nilai',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    nilai: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
  },
  { tableName: 'nilai' }
)

export default Nilai
