import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { env } from '../config/env.js'

const uploadDir = env.uploadDir
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Simpan sementara tanpa ekstensi; ekstensi final ditentukan dari
    // magic bytes agar MIME dan isi file selalu konsisten.
    cb(null, `tmp-${crypto.randomBytes(16).toString('hex')}`)
  }
})

const MIME_GAMBAR = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

const uploadGambar = multer({
  storage,
  limits: { fileSize: env.uploadMaxBytes, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    const okExt = /\.(png|jpe?g|gif|webp)$/i.test(file.originalname || '')
    const okMime = MIME_GAMBAR.has((file.mimetype || '').toLowerCase())
    if (okExt && okMime) return cb(null, true)

    const err = new Error('Sampul artikel harus berupa gambar PNG, JPG, GIF, atau WEBP.')
    err.status = 400
    return cb(err, false)
  }
})

function deteksiJenisGambar(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: '.png', mime: 'image/png' }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' }
  }
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/)) {
    return { ext: '.gif', mime: 'image/gif' }
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: '.webp', mime: 'image/webp' }
  }
  return null
}

async function hapusFile(filePath) {
  try {
    await fs.promises.unlink(filePath)
  } catch {
    // File mungkin sudah tidak ada.
  }
}

async function validasiIsiGambar(req, res, next) {
  if (!req.file) return next()

  const filePath = req.file.path
  try {
    const handle = await fs.promises.open(filePath, 'r')
    try {
      const buffer = Buffer.alloc(16)
      await handle.read(buffer, 0, 16, 0)
      const jenis = deteksiJenisGambar(buffer)
      if (!jenis) {
        await hapusFile(filePath)
        return res.status(400).json({ message: 'Isi file bukan gambar yang valid.' })
      }

      const namaFinal = `${Date.now()}-${crypto.randomBytes(10).toString('hex')}${jenis.ext}`
      const pathFinal = path.join(uploadDir, namaFinal)
      await fs.promises.rename(filePath, pathFinal)

      req.file.filename = namaFinal
      req.file.path = pathFinal
      req.file.mimetype = jenis.mime
      req.file.size = (await fs.promises.stat(pathFinal)).size
      return next()
    } finally {
      await handle.close()
    }
  } catch (e) {
    await hapusFile(filePath)
    return next(e)
  }
}

export function uploadGambarSingle(req, res, next) {
  uploadGambar.single('file')(req, res, (err) => {
    if (err) return next(err)
    return validasiIsiGambar(req, res, next)
  })
}

export { deteksiJenisGambar }
