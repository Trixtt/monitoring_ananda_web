import { ref, onMounted } from 'vue'
import api from '../services/api'

export function useOrtuProfil() {
  const siswa = ref(null)
  const tahunAjaran = ref('')
  const loading = ref(true)

  async function load() {
    try {
      const { data } = await api.get('/ortu/profil')
      siswa.value = data.siswa
      tahunAjaran.value = data.tahunAjaran
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { siswa, tahunAjaran, loading }
}
