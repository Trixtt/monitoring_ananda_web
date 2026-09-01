<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Nilai Akademik</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">Pilih mata pelajaran untuk melihat rincian nilainya.</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <template v-else>
      <div v-if="rekap.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="r in rekap"
          :key="r.mapel"
          :to="{ name: 'ortu-nilai-detail', params: { mapel: encodeURIComponent(r.mapel) } }"
          class="card p-5 group hover:shadow-lift-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="material-symbols-outlined text-deep-navy dark:text-ice-white">menu_book</span>
            <span class="badge bg-dark-teal/10 text-dark-teal dark:bg-white/10 dark:text-light-teal">Rata-rata: {{ r.rata }}</span>
          </div>
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white group-hover:text-dark-teal transition-colors">{{ r.mapel }}</h2>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">{{ r.daftar.length }} nilai tercatat</p>
        </router-link>
      </div>

      <EmptyState v-else title="Belum ada nilai" message="Belum ada nilai yang tercatat pada tahun ajaran ini." icon="menu_book" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
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
