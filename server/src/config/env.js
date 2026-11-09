import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_JWT_SECRET = 'ganti_dengan_secret_panjang'
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  if (!process.env.JWT_SECRET || jwtSecret === DEFAULT_JWT_SECRET || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter acak) sebelum menjalankan server di mode produksi.')
  }
} else if (jwtSecret === DEFAULT_JWT_SECRET) {
  console.warn('[Peringatan] JWT_SECRET belum diisi di .env — memakai secret default HANYA untuk development.')
}

function angka(nilai, fallback) {
  const n = Number(nilai)
  return Number.isFinite(n) ? n : fallback
}

function boolean(nilai, fallback = false) {
  if (nilai === undefined || nilai === null || nilai === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(nilai).toLowerCase())
}

const corsOrigin = process.env.CORS_ORIGIN || process.env.APP_DOMAIN || 'http://localhost:5173'

// Root aplikasi server (folder `server/`). Path upload & backup pada .env
// diinterpretasikan relatif terhadap folder ini, sesuai dokumentasi.
const serverRoot = path.resolve(__dirname, '../..')

export const env = {
  port: angka(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  demoMode: boolean(process.env.DEMO_MODE, !isProduction),
  trustProxy: process.env.TRUST_PROXY || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  jwtIssuer: process.env.JWT_ISSUER || 'monitoring-siswa',
  jwtAudience: process.env.JWT_AUDIENCE || 'monitoring-siswa-web',
  fonnteToken: process.env.FONNTE_TOKEN || '',
  fonnteUrl: process.env.FONNTE_URL || 'https://api.fonnte.com/send',
  appDomain: process.env.APP_DOMAIN || 'http://localhost:5173',
  corsOrigins: corsOrigin.split(',').map((s) => s.trim()).filter(Boolean),
  uploadDir: path.resolve(serverRoot, process.env.UPLOAD_DIR || 'uploads'),
  uploadMaxBytes: angka(process.env.UPLOAD_MAX_BYTES, 5 * 1024 * 1024),
  jsonLimit: process.env.JSON_LIMIT || '1mb',
  urlencodedLimit: process.env.URLENCODED_LIMIT || '100kb',
  backupDir: path.resolve(serverRoot, process.env.BACKUP_DIR || 'backups'),
  slowRequestMs: angka(process.env.SLOW_REQUEST_MS, 3000)
}

export const isWhatsAppEnabled = Boolean(env.fonnteToken)
