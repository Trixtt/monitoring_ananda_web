import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import api from '../services/api'

export const useNotifStore = defineStore('notifikasi', {
  state: () => ({
    list: [],
    unread: 0,
    socket: null,
    connected: false
  }),
  actions: {
    connect() {
      if (this.socket || !localStorage.getItem('token')) return
      const socket = io('/', {
        auth: { token: localStorage.getItem('token') }
      })
      socket.on('connect', () => {
        this.connected = true
      })
      socket.on('notifikasi:baru', (notif) => {
        this.unread++
        this.list.unshift(notif)
        this.list = this.list.slice(0, 50)
      })
      socket.on('disconnect', () => {
        this.connected = false
      })
      this.socket = socket
    },
    disconnect() {
      this.socket?.disconnect()
      this.socket = null
      this.connected = false
    },
    async fetch() {
      try {
        const { data } = await api.get('/auth/notifikasi/list')
        this.list = data.list
        this.unread = data.list.filter((n) => !n.isRead).length
      } catch {
        // abaikan
      }
    },
    async baca(id) {
      const item = this.list.find((n) => n.id === id)
      if (!item || item.isRead) return
      item.isRead = true
      this.unread = Math.max(0, this.unread - 1)
      api.patch(`/auth/notifikasi/${id}/baca`)
    },
    async bacaSemua() {
      this.list.forEach((n) => (n.isRead = true))
      this.unread = 0
      api.patch('/auth/notifikasi/baca-semua')
    }
  }
})
