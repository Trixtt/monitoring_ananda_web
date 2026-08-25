import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_JWT_SECRET = 'ganti_dengan_secret_panjang'
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || jwtSecret === DEFAULT_JWT_SECRET || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter acak) sebelum menjalankan server di mode produksi.')
  }
} else if (jwtSecret === DEFAULT_JWT_SECRET) {
  console.warn('[Peringatan] JWT_SECRET belum diisi di .env — memakai secret default HANYA untuk development.')
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  fonnteToken: process.env.FONNTE_TOKEN || '',
  fonnteUrl: process.env.FONNTE_URL || 'https://api.fonnte.com/send',
  appDomain: process.env.APP_DOMAIN || 'http://localhost:5173',
  uploadDir: path.resolve(__dirname, process.env.UPLOAD_DIR || '../uploads')
}
