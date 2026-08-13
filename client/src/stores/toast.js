import { defineStore } from 'pinia'

let id = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: []
  }),
  actions: {
    show(message, type = 'success', duration = 3500) {
      const toast = { id: ++id, message, type, duration }
      this.items.push(toast)
      setTimeout(() => this.dismiss(toast.id), duration)
    },
    success(message) {
      this.show(message, 'success')
    },
    error(message) {
      this.show(message, 'error', 5000)
    },
    info(message) {
      this.show(message, 'info')
    },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    }
  }
})
