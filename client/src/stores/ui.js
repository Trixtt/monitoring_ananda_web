import { ref, reactive } from 'vue'

const STORAGE_KEY = 'sd4-sidebar-collapsed'

const stored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const collapsed = ref(false)

function initSidebar() {
  const saved = stored()
  collapsed.value = saved === 'true'
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed.value))
  } catch {}
}

export function useUiStore() {
  return reactive({ collapsed, initSidebar, toggleSidebar })
}
