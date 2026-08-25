import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    role: (s) => s.user?.role || null,
    homePath() {
      switch (this.role) {
        case 'wali_kelas':
          return '/guru'
        case 'kepala_sekolah':
          return '/kepsek'
        case 'orang_tua':
          return '/orangtua'
        case 'admin':
          return '/admin'
        default:
          return '/login'
      }
    }
  },
  actions: {
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.setUser(data.user)
      return data
    },
    async logout() {
      try {
        await api.post('/auth/logout')
      } catch {
        // abaikan — cookie tetap dibersihkan di bawah
      }
      this.user = null
      localStorage.removeItem('user')
    },
    async changePassword(payload) {
      const { data } = await api.post('/auth/change-password', payload)
      return data
    },
    async me() {
      const { data } = await api.get('/auth/me')
      this.setUser(data.user)
      return data.user
    }
  }
})
