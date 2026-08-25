import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.resolve(__dirname, '../uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  }
})

const MIME_OK = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okExt = /\.(png|jpe?g|gif|webp|pdf|docx?|xlsx?)$/i.test(file.originalname || '')
    const mime = (file.mimetype || '').toLowerCase()
    const okMime = MIME_OK.has(mime)
    cb(
      okExt && okMime ? null : new Error('Jenis file tidak didukung.'),
      okExt && okMime
    )
  }
})

export const uploadSingle = upload.single('file')
