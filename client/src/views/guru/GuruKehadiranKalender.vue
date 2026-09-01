<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Kalender Kehadiran Kelas</h1>
      <p class="page-subtitle">Ringkasan kehadiran seluruh siswa setiap hari dalam satu bulan.</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else>
      <ContributionCalendar
        title="Kehadiran Kelas"
        :tahun="tahun"
        :bulan="bulan"
        :cells="cells"
        :legend="legend"
        @change-bulan="gantiBulan"
        @click-day="pilih"
      />

      <div v-if="selected" class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-title-md text-deep-navy dark:text-ice-white">{{ formatTanggal(selected.tanggal) }}</h2>
          <button class="icon-btn" @click="selected = null">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="st in ringkas" :key="st.key" class="p-3 rounded-lg bg-surface-container-low dark:bg-white/5">
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 capitalize">{{ st.label }}</p>
            <p class="font-headline-md" :class="st.color">{{ st.value }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../../services/api'
import { formatTanggal } from '../../utils/format'
import { useGuruKelas } from '../../composables/useGuruKelas'
import ContributionCalendar from '../../components/ContributionCalendar.vue'
import LoadingState from '../../components/LoadingState.vue'

const { params } = useGuruKelas()

const tahun = ref(new Date().getFullYear())
const bulan = ref(new Date().getMonth())
const data = ref(null)
const loading = ref(true)
const selected = ref(null)

function bulanParam() {
  return `${tahun.value}-${String(bulan.value + 1).padStart(2, '0')}`
}

const cells = computed(() => {
  const cells = {}
  ;(data.value?.kehadiran || []).forEach((k) => {
    const tidakHadir = k.alpa + k.izin + k.sakit
    cells[k.tanggal] = {
      cls: tidakHadir === 0 ? 'bg-status-aman' : 'bg-status-berisiko',
      tip: tidakHadir === 0 ? 'Semua hadir' : `${tidakHadir} siswa tidak hadir`,
      info: k
    }
  })
  return cells
})

const legend = [
  { cls: 'bg-status-aman', label: 'Semua hadir' },
  { cls: 'bg-status-berisiko', label: 'Ada yang tidak hadir' }
]

const ringkas = computed(() => {
  if (!selected.value) return []
  const s = selected.value
  return [
    { key: 'hadir', label: 'Hadir', value: s.hadir, color: 'text-status-aman' },
    { key: 'izin', label: 'Izin', value: s.izin, color: 'text-yellow-700' },
    { key: 'sakit', label: 'Sakit', value: s.sakit, color: 'text-dark-teal' },
    { key: 'alpa', label: 'Alpa', value: s.alpa, color: 'text-status-berisiko' }
  ]
})

function pilih(date, info) {
  selected.value = info || { tanggal: date.toISOString().slice(0, 10), hadir: 0, izin: 0, sakit: 0, alpa: 0 }
}

function gantiBulan(y, m) {
  tahun.value = y
  bulan.value = m
}

async function load() {
  loading.value = true
  try {
    const { data: d } = await api.get('/guru/kehadiran/kalender', { params: { bulan: bulanParam(), ...params() } })
    data.value = d
  } finally {
    loading.value = false
  }
}

watch([tahun, bulan], load)
onMounted(load)
</script>
