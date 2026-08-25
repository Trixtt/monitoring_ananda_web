<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Dashboard Kepala Sekolah</h1>
      <p class="page-subtitle">Rekap kondisi siswa seluruh kelas &middot; {{ data?.tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="cards" /></div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-up">
    <StatCard label="Total Siswa" :value="data.total.siswa" icon="groups" tone="teal" />
    <StatCard label="Baik / Aman" :value="data.total.aman" icon="check_circle" tone="green" />
    <StatCard label="Perlu Perhatian" :value="data.total.perhatian" icon="priority_high" tone="amber" />
    <StatCard label="Berisiko" :value="data.total.berisiko" icon="warning" tone="red" />
    <StatCard label="ABK" :value="data.total.abk" icon="accessibility_new" tone="purple" />
      </div>

      <div class="grid lg:grid-cols-3 gap-6 animate-fade-up" style="animation-delay: 100ms">
        <!-- Ringkasan per kelas -->
        <div class="card overflow-hidden lg:col-span-2">
          <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
            <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Kondisi per Kelas</h2>
            <router-link to="/kepsek/laporan" class="btn-ghost">
              Detail
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </router-link>
          </div>
          <div class="table-shell">
            <table class="table-base">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Wali Kelas</th>
                  <th>Aman</th>
                  <th>Perhatian</th>
                  <th>Berisiko</th>
                  <th>ABK</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="k in data.perKelas" :key="k.kelas.id">
                  <td class="font-label-md text-deep-navy dark:text-ice-white">{{ k.kelas.nama }}</td>
                  <td>{{ k.kelas.waliKelas || '-' }}</td>
                  <td class="text-status-aman font-label-md">{{ k.aman }}</td>
                  <td class="text-yellow-700 font-label-md">{{ k.perhatian }}</td>
                  <td class="text-status-berisiko font-label-md">{{ k.berisiko }}</td>
                  <td class="text-status-abk font-label-md">{{ k.abk }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ringkasan distribusi -->
        <div class="card p-6">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Distribusi Kondisi</h2>
          <div v-if="data.total.siswa" class="flex flex-col gap-3">
            <div v-for="(seg, kode) in distBars" :key="kode" class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="seg.color"></span>
              <span class="font-body-md text-on-surface-variant dark:text-ice-white/60 flex-1">{{ seg.label }}</span>
              <span class="font-label-md text-deep-navy dark:text-ice-white">{{ seg.count }} ({{ seg.pct }}%)</span>
            </div>
            <div class="h-3 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden flex mt-2">
              <div v-for="(seg, kode) in distBars" :key="kode" class="h-full" :class="seg.color" :style="{ width: seg.pct + '%' }"></div>
            </div>
          </div>
          <p v-else class="font-body-md text-on-surface-variant dark:text-ice-white/60">Belum ada data siswa.</p>
        </div>
      </div>
    </template>

    <EmptyState v-else title="Belum ada data" message="Belum ada data siswa untuk ditampilkan." icon="assessment" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const data = ref(null)
const loading = ref(true)

const distBars = computed(() => {
  if (!data.value) return {}
  const total = data.value.total.siswa || 1
  const defs = [
    { kode: 'aman', label: 'Baik / Aman', color: 'bg-status-aman' },
    { kode: 'perhatian', label: 'Perlu Perhatian', color: 'bg-status-perhatian' },
    { kode: 'berisiko', label: 'Berisiko', color: 'bg-status-berisiko' },
    { kode: 'abk', label: 'ABK', color: 'bg-status-abk' }
  ]
  return defs.map((d) => ({
    ...d,
    count: data.value.total[d.kode],
    pct: Math.round((data.value.total[d.kode] / total) * 100)
  }))
})

onMounted(async () => {
  try {
    const { data: res } = await api.get('/kepsek/ringkasan')
    data.value = res
  } finally {
    loading.value = false
  }
})
</script>
