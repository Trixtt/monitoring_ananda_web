import axios from 'axios'

let csrfToken = ''

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  if (csrfToken) config.headers['X-CSRF-TOKEN'] = csrfToken
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
    if (status === 401) {
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api