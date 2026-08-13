import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import './assets/main.css'

router.afterEach((to) => {
  const suffix = 'SD Negeri 4 Keling'
  const title = to.meta.title ? `${to.meta.title} - ${suffix}` : `Sistem Monitoring Perkembangan Siswa - ${suffix}`
  if (document.title !== title) document.title = title
  const desc = to.meta.description
  if (desc) {
    let el = document.querySelector('meta[name="description"]')
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', 'description')
      document.head.appendChild(el)
    }
    el.setAttribute('content', desc)
  }
})

const app = createApp(App)
app.use(createPinia())

useThemeStore().initTheme()

app.use(router)
app.mount('#app')
