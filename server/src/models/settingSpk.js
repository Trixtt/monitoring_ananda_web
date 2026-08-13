import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const SettingSpk = sequelize.define(
  'SettingSpk',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bobotAkademik: { type: DataTypes.FLOAT, defaultValue: 0.31 },
    bobotKehadiran: { type: DataTypes.FLOAT, defaultValue: 0.31 },
    bobotSikap: { type: DataTypes.FLOAT, defaultValue: 0.38 },
    intervalBaikBawah: { type: DataTypes.FLOAT, defaultValue: 0.67 },
    intervalPerhatianBawah: { type: DataTypes.FLOAT, defaultValue: 0.34 },
    intervalBerisikoBawah: { type: DataTypes.FLOAT, defaultValue: 0.0 }
  },
  { tableName: 'setting_spk' }
)

export default SettingSpk
