<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Nilai Akademik</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else>
      <div v-for="r in rekap" :key="r.mapel" class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between gap-3">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">{{ r.mapel }}</h2>
          <span class="badge bg-dark-teal/10 text-dark-teal dark:bg-white/10 dark:text-light-teal">
            Rata-rata: {{ r.rata }}
          </span>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Judul</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in r.daftar" :key="n.id">
                <td>{{ formatTanggal(n.tanggal) }}</td>
                <td>{{ n.judul }}</td>
                <td class="font-label-md text-deep-navy dark:text-ice-white">{{ n.nilai }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <EmptyState v-if="!rekap.length" title="Belum ada nilai" message="Belum ada nilai yang tercatat pada tahun ajaran ini." icon="menu_book" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { formatTanggal } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()

const rekap = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/ortu/rekap-nilai')
    rekap.value = data.rekap
  } finally {
    loading.value = false
  }
})
</script>
