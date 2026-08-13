import express from 'express'
import http from 'node:http'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { initDb } from './models/index.js'
import { setIo } from './services/notification.js'
import routes from './routes/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  await initDb()

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: { origin: env.appDomain, credentials: true }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
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

  app.use(
    cors({
      origin: env.appDomain,
      credentials: true
    })
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

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

main().catch((e) => {
  console.error('Gagal menjalankan server:', e)
  process.exit(1)
})
