import { ref, reactive } from 'vue'

const STORAGE_KEY = 'sd4-theme'

const stored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const dark = ref(false)

function apply() {
  document.documentElement.classList.toggle('dark', dark.value)
}

function initTheme() {
  const saved = stored()
  dark.value = saved ? saved === 'dark' : false
  apply()
}

function toggleTheme() {
  dark.value = !dark.value
  try {
    localStorage.setItem(STORAGE_KEY, dark.value ? 'dark' : 'light')
  } catch {}
  apply()
}

export function useThemeStore() {
  return reactive({ dark, initTheme, toggleTheme })
}
