import 'express-async-errors'
import express from 'express'
import http from 'node:http'
import crypto from 'node:crypto'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { Op } from 'sequelize'
import { env } from './config/env.js'
import { initDb, sequelize, Kelas, User } from './models/index.js'
import { setIo } from './services/notification.js'
import routes from './routes/index.js'
import { userDariToken } from './middlewares/auth.js'
import { AUTH_COOKIE, LEGACY_AUTH_COOKIE } from './services/authToken.js'

function originDiizinkan(origin) {
  if (!origin) return true
  return env.corsOrigins.includes(origin)
}

function parseCookieHeader(header) {
  const out = {}
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return out
}

async function main() {
  await initDb()
  await backfillWaliKelas()

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: { origin: env.corsOrigins, credentials: true },
    maxHttpBufferSize: 1e6
  })

  if (env.trustProxy) {
    const nilai = /^\d+$/.test(env.trustProxy) ? Number(env.trustProxy) : env.trustProxy
    app.set('trust proxy', nilai)
  }

  io.use((socket, next) => {
    const cookies = parseCookieHeader(socket.handshake.headers?.cookie || '')
    const token =
      cookies[AUTH_COOKIE] ||
      cookies[LEGACY_AUTH_COOKIE] ||
      socket.handshake.auth?.token ||
      null
    if (!token) return next(new Error('unauthorized'))

    userDariToken(token)
      .then((user) => {
        if (!user) return next(new Error('unauthorized'))
        socket.userId = user.id
        socket.userRole = user.role
        return next()
      })
      .catch(() => next(new Error('unauthorized')))
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`)

    let sesiLoginTerakhir = 0
    socket.on('sesi:login', async () => {
      const sekarang = Date.now()
      if (sekarang - sesiLoginTerakhir < 10_000) return
      sesiLoginTerakhir = sekarang

      let nama
      try {
        const user = await User.findByPk(socket.userId, { attributes: ['name'] })
        nama = user?.name || ''
      } catch {
        nama = ''
      }
      socket.emit('notifikasi:toast', {
        judul: 'Berhasil masuk',
        pesan: nama ? `Selamat datang, ${nama}.` : 'Selamat datang di aplikasi monitoring siswa.',
        tipe: 'sistem',
        link: null
      })
    })

    socket.on('disconnect', () => {})
  })

  setIo(io)

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: env.isProduction
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              fontSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"]
            }
          }
        : false
    })
  )
  app.use(compression())
  app.use(
    cors({
      origin(origin, callback) {
        if (originDiizinkan(origin)) return callback(null, true)
        return callback(new Error('Origin tidak diizinkan.'))
      },
      credentials: true
    })
  )
  app.use(express.json({ limit: env.jsonLimit }))
  app.use(express.urlencoded({ extended: true, limit: env.urlencodedLimit }))
  app.use(cookieParser())

  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || crypto.randomUUID()
    res.setHeader('X-Request-Id', req.id)
    next()
  })

  app.use(
    '/uploads',
    express.static(env.uploadDir, {
      dotfiles: 'deny',
      index: false,
      maxAge: '365d',
      immutable: true,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff')
      }
    })
  )

  app.use('/api', routes)

  app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan.' })
  })

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    if (err?.name === 'MulterError') {
      return res.status(400).json({ message: err.message })
    }

    const status = Number(err?.status || err?.statusCode) || 500
    // Jangan mencatat body/header mentah agar token dan PII tidak masuk log.
    console.error(`[Error ${req.id || '-'}] ${req.method} ${req.originalUrl} (${status}): ${err?.message || err}`)
    if (status >= 500 && err?.stack) console.error(err.stack.split('\n').slice(0, 4).join('\n'))

    const pesan =
      status >= 500 && env.isProduction
        ? 'Terjadi kesalahan server.'
        : err.message || 'Terjadi kesalahan server.'
    return res.status(status).json({ message: pesan, requestId: req.id })
  })

  server.headersTimeout = 20_000
  server.requestTimeout = 30_000
  server.keepAliveTimeout = 5_000

  server.listen(env.port, () => {
    console.log(`API server berjalan di http://localhost:${env.port}`)
    if (env.demoMode) console.log('[Demo] DEMO_MODE aktif — kredensial demo boleh ditampilkan di frontend.')
    if (!env.fonnteToken) console.log('[WhatsApp] Token Fonnte kosong — notifikasi WhatsApp dinonaktifkan (mode offline).')
  })

  let sedangTutup = false
  async function tutup(sinyal) {
    if (sedangTutup) return
    sedangTutup = true
    console.log(`[Server] Menerima ${sinyal}, menutup koneksi...`)
    const paksa = setTimeout(() => {
      console.error('[Server] Penutupan melebihi 10 detik, keluar paksa.')
      process.exit(1)
    }, 10_000)
    paksa.unref?.()

    io.close()
    server.close(async () => {
      try {
        await sequelize.close()
      } finally {
        clearTimeout(paksa)
        process.exit(0)
      }
    })
  }

  process.on('SIGINT', () => tutup('SIGINT'))
  process.on('SIGTERM', () => tutup('SIGTERM'))
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
