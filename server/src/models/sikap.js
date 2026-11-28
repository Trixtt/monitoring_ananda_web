import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

// Tabel sikap dipakai sebagai catatan kejadian, bukan penilaian angka 1-5.
// Nilai pengurangan disimpan sebagai snapshot pada setiap baris agar perubahan
// konfigurasi di kemudian hari tidak mengubah riwayat lama.
const Sikap = sequelize.define(
  'Sikap',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jenis: { type: DataTypes.ENUM('spiritual', 'sosial'), allowNull: false },
    kategori: { type: DataTypes.STRING(100), allowNull: false },
    pengurangan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    guruId: { type: DataTypes.INTEGER, allowNull: true },
    kehadiranId: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: 'sikap' }
)

export default Sikap
