import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import { useUiStore } from './stores/ui'
import { setSeo } from './utils/seo'
import '@fontsource/hanken-grotesk/latin-400.css'
import '@fontsource/hanken-grotesk/latin-400-italic.css'
import '@fontsource/hanken-grotesk/latin-500.css'
import '@fontsource/hanken-grotesk/latin-600.css'
import '@fontsource/hanken-grotesk/latin-700.css'
import '@fontsource/hanken-grotesk/latin-800.css'
import 'material-symbols/outlined.css'
import './assets/main.css'

if (document.fonts?.load) {
  document.fonts
    .load('1rem "Material Symbols Outlined"')
    .then(() => document.documentElement.classList.add('icons-ready'))
    .catch(() => {})
}

router.afterEach((to) => {
  const noindex = !to.meta.public || Boolean(to.meta.noindex)
  setSeo({
    title: to.meta.title ? `${to.meta.title} - SD Negeri 4 Keling` : undefined,
    description: to.meta.description,
    path: to.fullPath.split('?')[0],
    noindex
  })
})

const app = createApp(App)
app.use(createPinia())

useThemeStore().initTheme()
useUiStore().initSidebar()

app.use(router)
app.mount('#app')
