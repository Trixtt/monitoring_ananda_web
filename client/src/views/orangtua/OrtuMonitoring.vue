<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Monitor Anak</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">Pantau kehadiran dan sikap Ananda setiap hari selama satu bulan.</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Kalender Kehadiran -->
        <ContributionCalendar
          title="Kehadiran"
          :tahun="tahun"
          :bulan="bulan"
          :cells="cellsKehadiran"
          :legend="legendKehadiran"
          @change-bulan="gantiBulan"
          @click-day="pilihKehadiran"
        />

        <!-- Kalender Sikap -->
        <ContributionCalendar
          title="Sikap"
          :tahun="tahun"
          :bulan="bulan"
          :cells="cellsSikap"
          :legend="legendSikap"
          @change-bulan="gantiBulan"
          @click-day="pilihSikap"
        />
      </div>

      <!-- Panel detail kehadiran -->
      <div v-if="detailKehadiran" class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-title-md text-deep-navy dark:text-ice-white">{{ formatTanggal(detailKehadiran.tanggal) }}</h2>
          <button class="icon-btn" @click="detailKehadiran = null">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p v-if="detailKehadiran.kosong" class="font-body-md text-on-surface-variant dark:text-ice-white/60">
          Belum ada catatan kehadiran untuk hari ini. Data akan diisi oleh wali kelas setelah hari berjalan.
        </p>
        <template v-else>
          <span class="badge" :class="statusBadge(detailKehadiran.status).cls">{{ statusBadge(detailKehadiran.status).label }}</span>
          <p v-if="detailKehadiran.keterangan" class="mt-3 font-body-md text-on-surface-variant dark:text-ice-white/60">
            Keterangan: {{ detailKehadiran.keterangan }}
          </p>
          <p v-else class="mt-3 font-body-sm text-on-surface-variant dark:text-ice-white/40">Tidak ada keterangan tambahan.</p>
        </template>
      </div>

      <!-- Panel detail sikap -->
      <div v-if="detailSikap" class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-title-md text-deep-navy dark:text-ice-white">{{ formatTanggal(detailSikap.tanggal) }}</h2>
          <button class="icon-btn" @click="detailSikap = null">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p v-if="detailSikap.kosong" class="font-body-md text-on-surface-variant dark:text-ice-white/60">
          Belum ada penilaian sikap untuk hari ini. Guru akan mengisinya setelah hari berjalan.
        </p>
        <template v-else>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60">
            Nilai sikap: <span class="font-label-md text-deep-navy dark:text-ice-white">{{ labelSikap[Math.round(detailSikap.nilaiRata)] || '-' }}</span>
          </p>
          <p v-if="detailSikap.catatan" class="mt-3 font-body-md text-on-surface-variant dark:text-ice-white/60">
            Catatan guru: {{ detailSikap.catatan }}
          </p>
          <p v-else class="mt-3 font-body-sm text-on-surface-variant dark:text-ice-white/40">Tidak ada catatan khusus dari guru.</p>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../../services/api'
import { formatTanggal, labelSikap } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import ContributionCalendar from '../../components/ContributionCalendar.vue'
import LoadingState from '../../components/LoadingState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()

const tahun = ref(new Date().getFullYear())
const bulan = ref(new Date().getMonth())
const data = ref(null)
const loading = ref(true)
const detailKehadiran = ref(null)
const detailSikap = ref(null)

function bulanParam() {
  return `${tahun.value}-${String(bulan.value + 1).padStart(2, '0')}`
}

const cellsKehadiran = computed(() => {
  const cells = {}
  const dd = new Date(tahun.value, bulan.value + 1, 0).getDate()
  const hadirMap = {}
  ;(data.value?.kehadiran || []).forEach((k) => { hadirMap[k.tanggal] = k })
  for (let d = 1; d <= dd; d++) {
    const date = new Date(tahun.value, bulan.value, d)
    if (date.getDay() === 0) continue
    const iso = `${tahun.value}-${String(bulan.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const k = hadirMap[iso]
    if (k) {
      const cls = { hadir: 'bg-status-aman', izin: 'bg-yellow-400', sakit: 'bg-yellow-400', alpa: 'bg-status-berisiko' }[k.status] || 'bg-surface-variant'
      const label = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' }[k.status] || k.status
      cells[iso] = { cls, tip: label, info: k }
    } else {
      cells[iso] = { cls: 'bg-surface-variant/50 dark:bg-white/10', tip: 'Belum ada catatan', empty: true, info: { tanggal: iso, status: null, keterangan: null } }
    }
  }
  return cells
})

const cellsSikap = computed(() => {
  const cells = {}
  const dd = new Date(tahun.value, bulan.value + 1, 0).getDate()
  for (let d = 1; d <= dd; d++) {
    const date = new Date(tahun.value, bulan.value, d)
    if (date.getDay() === 0) continue
    const iso = `${tahun.value}-${String(bulan.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const rec = data.value?.sikap?.find((s) => s.tanggal === iso)
    if (rec) {
      cells[iso] = { cls: rec.catatan ? 'bg-sky-500' : 'bg-status-aman', tip: rec.catatan ? 'Ada catatan guru' : 'Baik', info: rec }
    } else {
      cells[iso] = { cls: 'bg-surface-variant/50 dark:bg-white/10', tip: 'Belum dinilai', empty: true, info: { tanggal: iso, nilaiRata: null, catatan: null } }
    }
  }
  return cells
})

const legendKehadiran = [
  { cls: 'bg-status-aman', label: 'Hadir' },
  { cls: 'bg-yellow-400', label: 'Izin / Sakit' },
  { cls: 'bg-status-berisiko', label: 'Alpa' }
]

const legendSikap = [
  { cls: 'bg-status-aman', label: 'Sikap Baik' },
  { cls: 'bg-sky-500', label: 'Ada catatan guru' }
]

function statusBadge(status) {
  return {
    hadir: { label: 'Hadir', cls: 'bg-status-aman/10 text-status-aman' },
    izin: { label: 'Izin', cls: 'bg-yellow-400/15 text-yellow-700' },
    sakit: { label: 'Sakit', cls: 'bg-yellow-400/15 text-yellow-700' },
    alpa: { label: 'Alpa', cls: 'bg-status-berisiko/10 text-status-berisiko' }
  }[status] || { label: status, cls: 'bg-surface-container-low dark:bg-white/10 text-on-surface-variant dark:text-ice-white/60' }
}

function pilihKehadiran(date, info) {
  detailKehadiran.value = info?.empty ? { ...info.info, kosong: true } : (info || { tanggal: date.toISOString().slice(0, 10), status: null, keterangan: null })
  detailSikap.value = null
}

function pilihSikap(date, info) {
  detailSikap.value = info?.empty ? { ...info.info, kosong: true } : info
  detailKehadiran.value = null
}

function gantiBulan(y, m) {
  tahun.value = y
  bulan.value = m
}

async function load() {
  loading.value = true
  try {
    const { data: d } = await api.get('/ortu/monitoring', { params: { bulan: bulanParam() } })
    data.value = d
  } finally {
    loading.value = false
  }
}

watch([tahun, bulan], load)
onMounted(load)
</script>
