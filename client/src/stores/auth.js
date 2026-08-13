import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
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
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.setSession(data.token, data.user)
      return data
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async changePassword(payload) {
      const { data } = await api.post('/auth/change-password', payload)
      return data
    },
    async me() {
      const { data } = await api.get('/auth/me')
      this.user = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      return data.user
    }
  }
})
