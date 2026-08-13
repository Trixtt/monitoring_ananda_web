import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ganti_dengan_secret_panjang',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  fonnteToken: process.env.FONNTE_TOKEN || '',
  fonnteUrl: process.env.FONNTE_URL || 'https://api.fonnte.com/send',
  appDomain: process.env.APP_DOMAIN || 'http://localhost:5173',
  uploadDir: path.resolve(__dirname, process.env.UPLOAD_DIR || '../uploads')
}
