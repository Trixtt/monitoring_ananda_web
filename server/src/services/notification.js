import { Notifikasi } from '../models/index.js'

let io = null

export function setIo(socketIo) {
  io = socketIo
}

export function getIo() {
  return io
}

export async function kirimNotifikasiInApp(userId, payload) {
  const notif = await Notifikasi.create({
    userId,
    judul: payload.judul,
    pesan: payload.pesan,
    tipe: payload.tipe || 'sistem',
    link: payload.link || null,
    isRead: false
  })

  if (io) {
    io.to(`user:${userId}`).emit('notifikasi:baru', notif.toJSON())
  }

  return notif
}
