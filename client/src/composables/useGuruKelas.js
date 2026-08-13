import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const STORAGE_KEY = 'adminKelasId'

function tersimpan() {
  return Number(localStorage.getItem(STORAGE_KEY) || 0)
}

export function useGuruKelas() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const kelasId = computed(() => {
    if (auth.role === 'admin') {
      return Number(route.params.kelasId || route.query.kelasId || tersimpan() || 0)
    }
    return auth.user?.kelasId || 0
  })

  function setKelas(id) {
    if (auth.role === 'admin') {
      localStorage.setItem(STORAGE_KEY, String(id))
      router.replace({ path: `/admin/guru/${id}` })
    }
  }

  function params() {
    const p = {}
    if (auth.role === 'admin' && kelasId.value) p.kelasId = kelasId.value
    return p
  }

  return { kelasId, setKelas, params }
}
