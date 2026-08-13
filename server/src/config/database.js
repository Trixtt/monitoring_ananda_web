import 'dotenv/config'
import { Sequelize } from 'sequelize'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dialect = process.env.DB_DIALECT || 'sqlite'

let sequelize

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'monitoring_siswa',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      dialect: 'mysql',
      logging: false,
      define: { underscored: false }
    }
  )
} else {
  const storage = path.resolve(__dirname, process.env.DB_STORAGE || '../../database/dev.sqlite')
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: { underscored: false }
  })
}

export default sequelize
