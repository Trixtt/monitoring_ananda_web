import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'wali_kelas', 'kepala_sekolah', 'orang_tua'),
      allowNull: false
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    photo: { type: DataTypes.STRING, allowNull: true },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  { tableName: 'users' }
)

export default User
