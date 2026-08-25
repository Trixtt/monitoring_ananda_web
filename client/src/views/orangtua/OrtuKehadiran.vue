<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Kehadiran</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hadir" :value="ringkas.hadir" icon="check_circle" tone="green" />
        <StatCard label="Izin" :value="ringkas.izin" icon="schedule" tone="amber" />
        <StatCard label="Sakit" :value="ringkas.sakit" icon="healing" tone="blue" />
        <StatCard label="Alpa" :value="ringkas.alpa" icon="cancel" tone="red" />
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Kehadiran</h2>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="k in list" :key="k.id">
                <td>{{ formatTanggal(k.tanggal) }}</td>
                <td><span class="badge" :class="kehadiranMap[k.status].cls">{{ kehadiranMap[k.status].label }}</span></td>
                <td>{{ k.keterangan || '-' }}</td>
              </tr>
              <tr v-if="!list.length">
                <td colspan="3" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada catatan kehadiran</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { formatTanggal, kehadiranMap } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()

const ringkas = ref({ hadir: 0, izin: 0, sakit: 0, alpa: 0 })
const list = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/ortu/kehadiran')
    ringkas.value = data.ringkas
    list.value = data.list
  } finally {
    loading.value = false
  }
})
</script>
