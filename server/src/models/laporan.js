import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Laporan = sequelize.define(
  'Laporan',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    judul: { type: DataTypes.STRING, allowNull: false },
    kelasId: { type: DataTypes.INTEGER, allowNull: true },
    kelasNama: { type: DataTypes.STRING, allowNull: true },
    kategori: { type: DataTypes.STRING, allowNull: true },
    tanggalMulai: { type: DataTypes.DATEONLY, allowNull: true },
    tanggalAkhir: { type: DataTypes.DATEONLY, allowNull: true },
    jumlah: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isi: { type: DataTypes.TEXT, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false }
  },
  { tableName: 'laporan' }
)

export default Laporan
