<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Sikap</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else>
      <div class="grid grid-cols-2 gap-4">
        <div class="card p-6">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Sikap Spiritual</p>
          <p class="font-headline-lg text-deep-navy dark:text-ice-white">{{ ringkas.spiritual.jumlah ? rataLabel(ringkas.spiritual) : '-' }}</p>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">{{ ringkas.spiritual.jumlah }} penilaian</p>
        </div>
        <div class="card p-6">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Sikap Sosial</p>
          <p class="font-headline-lg text-deep-navy dark:text-ice-white">{{ ringkas.sosial.jumlah ? rataLabel(ringkas.sosial) : '-' }}</p>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">{{ ringkas.sosial.jumlah }} penilaian</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Penilaian Sikap</h2>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Nilai</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in list" :key="s.id">
                <td>{{ formatTanggal(s.tanggal) }}</td>
                <td class="capitalize">{{ s.jenis }}</td>
                <td><span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ labelSikap[s.nilai] }}</span></td>
                <td>{{ s.catatan || '-' }}</td>
              </tr>
              <tr v-if="!list.length">
                <td colspan="4" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada penilaian sikap</td>
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
import { formatTanggal, labelSikap } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import LoadingState from '../../components/LoadingState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()

const ringkas = ref({ spiritual: { jumlah: 0, total: 0 }, sosial: { jumlah: 0, total: 0 } })
const list = ref([])
const loading = ref(true)

function rataLabel(j) {
  return labelSikap[Math.round(j.total / j.jumlah)] || '-'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/ortu/sikap')
    ringkas.value = data.ringkas
    list.value = data.list
  } finally {
    loading.value = false
  }
})
</script>
