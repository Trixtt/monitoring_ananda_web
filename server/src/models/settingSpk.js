import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const SettingSpk = sequelize.define(
  'SettingSpk',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bobotAkademik: { type: DataTypes.FLOAT, defaultValue: 4 / 13 },
    bobotKehadiran: { type: DataTypes.FLOAT, defaultValue: 4 / 13 },
    bobotSikap: { type: DataTypes.FLOAT, defaultValue: 5 / 13 },
    intervalBaikBawah: { type: DataTypes.FLOAT, defaultValue: 0.67 },
    intervalPerhatianBawah: { type: DataTypes.FLOAT, defaultValue: 0.34 },
    intervalBerisikoBawah: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    ambangAkademik: { type: DataTypes.FLOAT, defaultValue: 0.65 },
    ambangSikap: { type: DataTypes.FLOAT, defaultValue: 0.65 },
    ambangKehadiran: { type: DataTypes.FLOAT, defaultValue: 0.8 }
  },
  { tableName: 'setting_spk' }
)

export default SettingSpk
