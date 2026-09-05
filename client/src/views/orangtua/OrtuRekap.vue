<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Rekap Perkembangan</h1>
        <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
      </div>
      <button class="btn-secondary" :disabled="downloading" @click="unduhPdf">
        <span v-if="downloading" class="w-4 h-4 border-2 border-dark-teal border-t-transparent rounded-full animate-spin"></span>
        <span class="material-symbols-outlined text-[18px]" v-else>picture_as_pdf</span>
        Unduh Rapor (PDF)
      </button>
    </div>

    <div v-if="loading && !data"><LoadingState /></div>

    <template v-else-if="data">
      <!-- Rincian skor -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Rincian Skor</h2>
          <div class="flex items-center gap-2">
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">Skor SPK</p>
            <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ data.skor.abk ? 'ABK' : formatSkor(data.skor.skor) }}</p>
            <StatusBadge :kode="data.skor.kategori.kode" />
          </div>
        </div>
        <div class="space-y-4">
          <div v-for="s in skorBars" :key="s.key">
            <div class="flex justify-between font-label-md mb-1">
              <span class="text-on-surface-variant dark:text-ice-white/60">{{ s.label }}</span>
              <span class="text-deep-navy dark:text-ice-white">{{ persen(s.value) }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden">
              <div class="h-full rounded-full" :class="s.color" :style="{ width: (s.value * 100).toFixed(1) + '%' }"></div>
            </div>
          </div>
        </div>
        <p v-if="data.mapelTerlemah" class="mt-4 font-body-md text-on-surface-variant dark:text-ice-white/60">
          Mapel terlemah: <span class="font-label-md text-status-berisiko">{{ data.mapelTerlemah }}</span>
        </p>
      </div>

      <!-- Rata-rata per mapel -->
      <div v-if="rekap.length" class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Rata-rata Nilai per Mapel</h2>
        <div class="space-y-4">
          <div v-for="r in rekap" :key="r.mapel">
            <div class="flex justify-between font-label-md mb-1">
              <span class="text-on-surface-variant dark:text-ice-white/60">{{ r.mapel }}</span>
              <span class="text-deep-navy dark:text-ice-white">{{ r.rata }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden">
              <div class="h-full rounded-full bg-dark-teal" :style="{ width: r.rata + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Rekomendasi (di bawah semua rekap) -->
      <section v-if="data.rekomendasi" class="card p-6">
        <div class="mb-4">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Rekomendasi</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mt-1">Saran tindak lanjut yang dapat dilakukan untuk mendukung perkembangan Ananda.</p>
        </div>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-3">{{ data.rekomendasi.pesan }}</p>
        <ul class="space-y-2">
          <li v-for="r in data.rekomendasi.daftar" :key="r" class="flex items-start gap-2 font-body-md text-on-surface text-sm">
            <span class="material-symbols-outlined text-[18px] text-dark-teal mt-0.5">check_circle</span>
            {{ r }}
          </li>
        </ul>
      </section>
    </template>

    <EmptyState v-else title="Data belum tersedia" message="Data siswa belum tertaut ke akun Anda. Hubungi admin sekolah." icon="assessment" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { formatSkor, persen } from '../../utils/format'
import { unduhRaporPdf } from '../../utils/raporPdf'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import { useToastStore } from '../../stores/toast'
import StatusBadge from '../../components/StatusBadge.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()
const toast = useToastStore()

const data = ref(null)
const rekap = ref([])
const loading = ref(true)
const downloading = ref(false)

const skorBars = computed(() => {
  if (!data.value || data.value.skor.abk) return []
  const s = data.value.skor
  return [
    { key: 'akademik', label: 'Akademik', value: s.skorAkademik, color: 'bg-dark-teal' },
    { key: 'kehadiran', label: 'Kehadiran', value: s.skorKehadiran, color: 'bg-sky-600' },
    { key: 'sikap', label: 'Sikap', value: s.skorSikap, color: 'bg-purple-600' }
  ]
})

async function unduhPdf() {
  downloading.value = true
  try {
    const { data: res } = await api.get('/ortu/rapor')
    await unduhRaporPdf(res.rapor)
    toast.success('PDF berhasil diunduh.')
  } catch (e) {
    toast.error(e?.response?.data?.message || 'Gagal mengunduh PDF rapor.')
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  try {
    const { data: d } = await api.get('/ortu/dashboard')
    data.value = d
    const { data: r } = await api.get('/ortu/rekap-nilai')
    rekap.value = r.rekap
  } finally {
    loading.value = false
  }
})
</script>
