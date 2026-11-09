import axios from 'axios'

let csrfToken = ''

function bacaCookie(nama) {
  const target = `${nama}=`
  for (const part of document.cookie.split(';')) {
    const item = part.trim()
    if (item.startsWith(target)) return decodeURIComponent(item.slice(target.length))
  }
  return ''
}

function tokenCsrf() {
  if (csrfToken) return csrfToken
  // Cookie CSRF tidak httpOnly agar bisa dibaca klien (double-submit).
  // Fallback ini penting setelah halaman dimuat ulang sebelum /auth/me selesai.
  csrfToken = bacaCookie('csrfToken') || bacaCookie('__Host-csrf')
  return csrfToken
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = tokenCsrf()
  if (token) config.headers['X-CSRF-TOKEN'] = token
  return config
})

api.interceptors.response.use(
  (res) => {
    const t = res.data?.csrfToken
    if (t) csrfToken = t
    return res
  },
  (err) => {
    const status = err.response?.status
    const code = err.response?.data?.code
    if (status === 401) {
      localStorage.removeItem('user')
      if (!['/login', '/lupa-password'].includes(window.location.pathname)) {
        window.location.href = '/login'
      }
    } else if (status === 403 && code === 'PASSWORD_CHANGE_REQUIRED') {
      if (window.location.pathname !== '/ganti-password') {
        window.location.href = '/ganti-password'
      }
    }
    return Promise.reject(err)
  }
)

export default api
