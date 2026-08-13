import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Mapel = sequelize.define(
  'Mapel',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false, unique: true }
  },
  { tableName: 'mapel' }
)

export default Mapel
