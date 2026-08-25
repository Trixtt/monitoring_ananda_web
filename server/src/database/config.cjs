require('dotenv').config()
const path = require('node:path')

const dialect = process.env.DB_DIALECT || 'sqlite'
const storage = process.env.DB_STORAGE || path.resolve(__dirname, 'dev.sqlite')

module.exports = {
  development: {
    username: process.env.DB_USER || null,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'monitoring_siswa',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect,
    storage,
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect,
    storage,
    logging: false
  }
}
