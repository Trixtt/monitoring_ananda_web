<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="page-title">Dashboard Kepala Sekolah</h1>
        <p class="page-subtitle">Rekap kondisi siswa seluruh kelas &middot; {{ data?.tahunAjaran || '' }}</p>
      </div>
      <div class="flex items-end gap-2">
        <label class="label !mb-1" for="tahunAjaran">Tahun Ajaran</label>
        <select id="tahunAjaran" class="input w-auto" :value="tahunAjaranId" @change="gantiTahunAjaran($event.target.value)">
          <option :value="''">Semua Tahun</option>
          <option v-for="t in daftarTahunAjaran" :key="t.id" :value="t.id">{{ t.nama }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="cards" /></div>

    <template v-else-if="data">
      <div class="grid grid-cols-3 gap-2 sm:gap-4 animate-fade-up">
        <StatCard compact label="Total Siswa" :value="data.total.siswa" icon="groups" tone="teal" />
        <StatCard compact label="Total Kelas" :value="data.perKelas.length" icon="door_sliding" tone="blue" />
        <StatCard compact label="Baik / Aman" :value="data.total.aman" icon="check_circle" tone="green" />
        <StatCard compact label="Perlu Perhatian" :value="data.total.perhatian" icon="priority_high" tone="amber" />
        <StatCard compact label="Berisiko" :value="data.total.berisiko" icon="warning" tone="red" />
        <StatCard compact label="ABK" :value="data.total.abk" icon="accessibility_new" tone="purple" />
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="card p-6 animate-fade-up" style="animation-delay: 100ms">
          <div class="mb-5">
            <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Distribusi Kondisi</h2>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">Sebaran kondisi seluruh siswa</p>
          </div>
          <DonutChart
            v-if="data.total.siswa"
            :segments="distribusi"
            :total="data.total.siswa"
            center-label="Siswa"
          />
          <p v-else class="font-body-md text-on-surface-variant dark:text-ice-white/60">Belum ada data siswa.</p>
        </div>

        <div class="card p-6 lg:col-span-2 animate-fade-up" style="animation-delay: 150ms">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Komposisi Kondisi per Kelas</h2>
              <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">Panjang bar menunjukkan jumlah siswa pada kelas</p>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1.5">
              <span v-for="seg in distribusi" :key="seg.key" class="inline-flex items-center gap-1.5 font-label-sm text-on-surface-variant dark:text-ice-white/60">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: seg.color }"></span>
                {{ seg.label }}
              </span>
            </div>
          </div>
          <HorizontalBarChart :rows="kelasRows" />
        </div>
      </div>

      <div class="card overflow-hidden animate-fade-up" style="animation-delay: 200ms">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Rincian per Kelas</h2>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">Jumlah siswa berdasarkan kondisi perkembangan</p>
          </div>
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
import DonutChart from '../../components/charts/DonutChart.vue'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart.vue'

const data = ref(null)
const loading = ref(true)
const tahunAjaranId = ref('')
const daftarTahunAjaran = ref([])

const definisiKondisi = [
  { key: 'aman', label: 'Baik / Aman', color: '#22C55E' },
  { key: 'perhatian', label: 'Perlu Perhatian', color: '#FACC15' },
  { key: 'berisiko', label: 'Berisiko', color: '#EF4444' },
  { key: 'abk', label: 'ABK', color: '#A855F7' }
]

const distribusi = computed(() =>
  definisiKondisi.map((item) => ({
    ...item,
    value: Number(data.value?.total?.[item.key] || 0)
  }))
)

const kelasRows = computed(() => {
  if (!data.value) return []
  return data.value.perKelas.map((kelas) => {
    const segments = definisiKondisi.map((item) => ({
      ...item,
      value: Number(kelas[item.key] || 0)
    }))
    return {
      key: kelas.kelas.id,
      label: kelas.kelas.nama,
      total: segments.reduce((jumlah, item) => jumlah + item.value, 0),
      segments
    }
  })
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/kepsek/ringkasan', {
      params: { tahunAjaranId: tahunAjaranId.value || undefined }
    })
    data.value = res
    if (!tahunAjaranId.value && res.tahunAjaranId) tahunAjaranId.value = res.tahunAjaranId
    daftarTahunAjaran.value = res.daftarTahunAjaran || []
  } finally {
    loading.value = false
  }
}

function gantiTahunAjaran(v) {
  tahunAjaranId.value = v
  load()
}

onMounted(load)
</script>
