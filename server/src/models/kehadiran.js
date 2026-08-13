import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Kehadiran = sequelize.define(
  'Kehadiran',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tanggal: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('hadir', 'izin', 'sakit', 'alpa'), allowNull: false },
    keterangan: { type: DataTypes.STRING, allowNull: true }
  },
  { tableName: 'kehadiran' }
)

export default Kehadiran
