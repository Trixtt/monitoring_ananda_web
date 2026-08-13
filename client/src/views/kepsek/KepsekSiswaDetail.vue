<template>
  <div class="space-y-6">
    <div>
      <router-link to="/kepsek/laporan" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-3">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Laporan
      </router-link>
      <div v-if="siswa" class="flex items-start justify-between gap-3">
        <div>
          <h1 class="page-title">{{ siswa.nama }}</h1>
          <p class="page-subtitle">Kelas {{ siswa.kelas?.nama }} &middot; NISN {{ siswa.nisn }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <StatusBadge v-if="skor" :kode="skor.kategori.kode" />
          <router-link :to="`/kepsek/rapor/${route.params.id}`" class="btn-secondary !px-3 !py-2">
            <span class="material-symbols-outlined text-[18px]">description</span>
            Rapor
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else-if="siswa">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Skor SPK</p>
          <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ skor.abk ? 'ABK' : formatSkor(skor.skor) }}</p>
        </div>
        <div class="card p-5">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Akademik</p>
          <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ skor.abk ? '-' : persen(skor.skorAkademik) }}</p>
        </div>
        <div class="card p-5">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Kehadiran</p>
          <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ skor.abk ? '-' : persen(skor.skorKehadiran) }}</p>
        </div>
        <div class="card p-5">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Sikap</p>
          <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ skor.abk ? '-' : persen(skor.skorSikap) }}</p>
        </div>
      </div>

      <div class="card p-6 border-l-4 border-dark-teal">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-2">Rekomendasi</h2>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-3">{{ rekomendasi?.pesan }}</p>
        <ul class="space-y-2">
          <li v-for="r in rekomendasi?.daftar" :key="r" class="flex items-start gap-2 font-body-md text-on-surface text-sm">
            <span class="material-symbols-outlined text-[18px] text-dark-teal mt-0.5">arrow_forward_ios</span>
            {{ r }}
          </li>
        </ul>
        <p class="font-label-sm text-outline dark:text-ice-white/40 mt-4">Mapel terlemah: <span class="text-dark-teal font-label-md">{{ mapelTerlemah || '-' }}</span></p>
      </div>
    </template>

    <EmptyState v-else title="Siswa tidak ditemukan" icon="search_off" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { formatSkor, persen } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const siswa = ref(null)
const skor = ref(null)
const rekomendasi = ref(null)
const mapelTerlemah = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/kepsek/siswa/${route.params.id}`)
    siswa.value = data.siswa
    skor.value = data.skor
    rekomendasi.value = data.rekomendasi
    mapelTerlemah.value = data.mapelTerlemah
  } finally {
    loading.value = false
  }
})
</script>
