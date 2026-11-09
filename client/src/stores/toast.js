import { defineStore } from 'pinia'

let id = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: []
  }),
  actions: {
    show(message, type = 'success', duration = 3500, title = '') {
      const toast = { id: ++id, message, title, type, duration }
      this.items.push(toast)
      if (this.items.length > 3) this.items = this.items.slice(-3)
      setTimeout(() => this.dismiss(toast.id), duration)
    },
    success(message, title = '') {
      this.show(message, 'success', 3500, title)
    },
    error(message, title = '') {
      this.show(message, 'error', 5000, title)
    },
    info(message, title = '') {
      this.show(message, 'info', 3500, title)
    },
    warning(message, title = '') {
      this.show(message, 'warning', 5000, title)
    },
    notify(payload = {}) {
      const tipe = payload.tipe || 'sistem'
      const typeMap = { nilai: 'success', kehadiran: 'warning', sikap: 'warning', sistem: 'info' }
      const durasi = tipe === 'sistem' ? 3500 : 5000
      this.show(payload.pesan || '', typeMap[tipe] || 'info', durasi, payload.judul || '')
    },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    }
  }
})
