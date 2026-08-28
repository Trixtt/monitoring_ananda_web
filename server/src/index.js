import express from 'express'
import http from 'node:http'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { env } from './config/env.js'
import { initDb, Kelas, User } from './models/index.js'
import { setIo } from './services/notification.js'
import routes from './routes/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  await initDb()
  await backfillWaliKelas()

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: { origin: env.appDomain, credentials: true }
  })

function parseCookieHeader(header) {
  const out = {}
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return out
}

io.use((socket, next) => {
  const cookies = parseCookieHeader(socket.handshake.headers?.cookie || '')
  const token = cookies.token || socket.handshake.auth?.token || null
  if (!token) return next(new Error('unauthorized'))
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    socket.userId = payload.id
    next()
  } catch {
    next(new Error('unauthorized'))
  }
})

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`)
    socket.on('disconnect', () => {})
  })

  setIo(io)

  app.use(helmet())
  app.use(
    cors({
      origin: env.appDomain,
      credentials: true
    })
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use('/uploads', express.static(path.resolve(__dirname, env.uploadDir)))

  app.use('/api', routes)

  app.use((err, req, res, next) => {
    if (err?.name === 'MulterError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('[Error]', err)
    return res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan server.' })
  })

  server.listen(env.port, () => {
    console.log(`API server berjalan di http://localhost:${env.port}`)
  })
}

async function backfillWaliKelas() {
  try {
    const walis = await User.findAll({
      where: { role: 'wali_kelas', kelasId: { [Op.ne]: null }, active: true },
      order: [['id', 'ASC']]
    })
    for (const u of walis) {
      const kelas = await Kelas.findByPk(u.kelasId)
      if (kelas && !kelas.waliKelas) {
        await kelas.update({ waliKelas: u.name })
        console.log(`[Backfill] Wali kelas ${kelas.nama}: ${u.name}`)
      }
    }
  } catch (e) {
    console.error('[Backfill] Gagal sinkronisasi wali kelas:', e.message)
  }
}

main().catch((e) => {
  console.error('Gagal menjalankan server:', e)
  process.exit(1)
})
