<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Kalender Kehadiran Kelas</h1>
      <p class="page-subtitle">Ringkasan kehadiran seluruh siswa setiap hari dalam satu bulan.</p>
    </div>

    <div v-if="loading && !data"><LoadingState /></div>

    <EmptyState
      v-else-if="error && !data"
      title="Gagal memuat kalender"
      message="Kalender kehadiran tidak bisa dimuat. Periksa koneksi Anda, lalu coba lagi."
      icon="cloud_off"
    >
      <button class="btn-primary" @click="load">
        <span class="material-symbols-outlined text-[18px]">refresh</span>
        Muat Ulang
      </button>
    </EmptyState>

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

        <div v-if="selected.daftar && selected.daftar.length" class="mt-4">
          <h3 class="font-label-md text-on-surface-variant dark:text-ice-white/70 mb-2">Tidak Hadir</h3>
          <ul class="space-y-2">
            <li
              v-for="s in selected.daftar"
              :key="s.id"
              class="flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-low dark:bg-white/5 px-3 py-2"
            >
              <span class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ s.nomorAbsen }}.</span>
              <span class="font-label-md text-deep-navy dark:text-ice-white">{{ s.nama }}</span>
              <span class="badge" :class="statusBadgeCls[s.status]">{{ statusLabel[s.status] || s.status }}</span>
              <span v-if="s.keterangan" class="font-body-sm text-on-surface-variant/70 dark:text-ice-white/50 ml-auto text-right">{{ s.keterangan }}</span>
            </li>
          </ul>
        </div>
        <p v-else-if="selected.daftar" class="mt-4 font-body-md text-status-aman">Semua siswa hadir.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { formatTanggal } from '../../utils/format'
import { useGuruKelas } from '../../composables/useGuruKelas'
import ContributionCalendar from '../../components/ContributionCalendar.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { params } = useGuruKelas()

const tahun = ref(new Date().getFullYear())
const bulan = ref(new Date().getMonth())
const data = ref(null)
const loading = ref(true)
const error = ref(false)
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

const statusLabel = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' }
const statusBadgeCls = {
  hadir: 'bg-status-aman/10 text-status-aman',
  izin: 'bg-yellow-400/15 text-yellow-700',
  sakit: 'bg-dark-teal/10 text-dark-teal',
  alpa: 'bg-status-berisiko/10 text-status-berisiko'
}

function pilih(date, info) {
  selected.value = info || { tanggal: date.toISOString().slice(0, 10), hadir: 0, izin: 0, sakit: 0, alpa: 0, daftar: [] }
}

function gantiBulan(y, m) {
  tahun.value = y
  bulan.value = m
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const { data: d } = await api.get('/guru/kehadiran/kalender', { params: { bulan: bulanParam(), ...params() } })
    data.value = d
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function refreshSaatTerlihat() {
  if (document.visibilityState === 'visible' && !loading.value) load()
}

watch([tahun, bulan], load)
onMounted(() => {
  load()
  window.addEventListener('focus', refreshSaatTerlihat)
  document.addEventListener('visibilitychange', refreshSaatTerlihat)
})
onUnmounted(() => {
  window.removeEventListener('focus', refreshSaatTerlihat)
  document.removeEventListener('visibilitychange', refreshSaatTerlihat)
})
</script>
