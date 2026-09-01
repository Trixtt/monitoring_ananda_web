<template>
  <div class="space-y-6">
    <div>
      <router-link to="/orangtua/nilai" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-3">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke daftar mapel
      </router-link>
      <h1 class="page-title">{{ mapelNama || 'Nilai Mata Pelajaran' }}</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <template v-else>
      <div v-if="detail" class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between gap-3">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">{{ detail.mapel }}</h2>
          <span class="badge bg-dark-teal/10 text-dark-teal dark:bg-white/10 dark:text-light-teal">Rata-rata: {{ detail.rata }}</span>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Judul</th>
                <th class="text-right">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(n, i) in detail.daftar" :key="n.id">
                <td>{{ i + 1 }}</td>
                <td>{{ formatTanggal(n.tanggal) }}</td>
                <td>{{ n.judul }}</td>
                <td class="text-right font-label-md text-deep-navy dark:text-ice-white">{{ n.nilai }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <EmptyState v-else title="Mapel tidak ditemukan" message="Data mapel tidak tersedia pada tahun ajaran ini." icon="search_off" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { formatTanggal } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const { siswa, tahunAjaran } = useOrtuProfil()

const rekap = ref([])
const loading = ref(true)

const mapelNama = computed(() => {
  try {
    return decodeURIComponent(route.params.mapel || '')
  } catch {
    return route.params.mapel || ''
  }
})

const detail = computed(() => rekap.value.find((r) => r.mapel === mapelNama.value) || null)

onMounted(async () => {
  try {
    const { data } = await api.get('/ortu/rekap-nilai')
    rekap.value = data.rekap
  } finally {
    loading.value = false
  }
})
</script>
