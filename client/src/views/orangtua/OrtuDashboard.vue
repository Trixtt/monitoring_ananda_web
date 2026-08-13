<template>
  <div class="space-y-8">
    <div>
      <h1 class="page-title">Perkembangan Ananda</h1>
      <p class="page-subtitle">{{ data?.siswa?.nama }} &middot; Kelas {{ data?.siswa?.kelas?.nama }} &middot; {{ data?.tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <div v-else-if="data" class="space-y-6">
      <!-- Ringkasan skor -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <div class="card p-6 flex flex-col items-center text-center">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Skor SPK</p>
          <p class="font-headline-lg text-deep-navy dark:text-ice-white leading-none">{{ data.skor.abk ? 'ABK' : formatSkor(data.skor.skor) }}</p>
          <div class="mt-3"><StatusBadge :kode="data.skor.kategori.kode" /></div>
        </div>
        <StatCard label="Nilai Akademik" :value="data.skor.abk ? '-' : persen(data.skor.skorAkademik)" icon="menu_book" tone="teal" />
        <StatCard label="Kehadiran" :value="data.skor.abk ? '-' : persen(data.skor.skorKehadiran)" icon="how_to_reg" tone="blue" />
        <StatCard label="Sikap" :value="data.skor.abk ? '-' : persen(data.skor.skorSikap)" icon="favorite" tone="purple" />
      </div>

      <!-- Navigasi menu -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style="animation-delay: 100ms">
        <router-link v-for="nav in navMenus" :key="nav.to" :to="nav.to" class="card p-5 hover:border-dark-teal/60 hover:shadow-lift-md transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" :class="nav.bg">
              <span class="material-symbols-outlined text-[22px]" :class="nav.iconCls">{{ nav.icon }}</span>
            </span>
            <p class="font-title-lg text-deep-navy dark:text-ice-white">{{ nav.label }}</p>
          </div>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm mb-2">{{ nav.desc }}</p>
          <p class="font-label-sm text-dark-teal dark:text-light-teal flex items-center gap-1">
            Lihat
            <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </p>
        </router-link>
      </div>

      <!-- Rekomendasi -->
      <div v-if="data.rekomendasi" class="card p-6 border-l-4 border-dark-teal">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-2">Rekomendasi untuk Ananda</h2>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-3">{{ data.rekomendasi.pesan }}</p>
        <ul class="space-y-2">
          <li v-for="r in data.rekomendasi.daftar" :key="r" class="flex items-start gap-2 font-body-md text-on-surface text-sm">
            <span class="material-symbols-outlined text-[18px] text-dark-teal mt-0.5">favorite</span>
            {{ r }}
          </li>
        </ul>
      </div>

      <!-- Kehadiran ringkas -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Kehadiran Bulan Ini</h2>
          <router-link to="/orangtua/kehadiran" class="btn-ghost">
            Detail
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </router-link>
        </div>
        <div class="grid grid-cols-4 gap-4">
          <div v-for="(r, key) in data.ringkasKehadiran" :key="key" class="text-center rounded-lg bg-surface-container-low dark:bg-white/5 p-5">
            <p class="font-headline-lg text-deep-navy dark:text-ice-white">{{ r }}</p>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 capitalize">{{ key }}</p>
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-else title="Data belum tersedia" message="Data siswa belum tertaut ke akun Anda. Hubungi admin sekolah." icon="child_care" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { formatSkor, persen } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const data = ref(null)
const loading = ref(true)

const navMenus = [
  {
    to: '/orangtua/nilai',
    label: 'Nilai Akademik',
    desc: 'Nilai per mata pelajaran dan rata-ratanya',
    icon: 'menu_book',
    bg: 'bg-dark-teal/15 dark:bg-dark-teal/25',
    iconCls: 'text-dark-teal dark:text-light-teal'
  },
  {
    to: '/orangtua/kehadiran',
    label: 'Kehadiran',
    desc: 'Rekap hadir, izin, sakit, dan alpa',
    icon: 'how_to_reg',
    bg: 'bg-sky-600/15 dark:bg-sky-500/20',
    iconCls: 'text-sky-700 dark:text-sky-300'
  },
  {
    to: '/orangtua/sikap',
    label: 'Sikap',
    desc: 'Penilaian sikap spiritual dan sosial',
    icon: 'favorite',
    bg: 'bg-purple-600/15 dark:bg-purple-500/20',
    iconCls: 'text-purple-700 dark:text-purple-300'
  },
  {
    to: '/orangtua/rekap',
    label: 'Rekap',
    desc: 'Ringkasan skor dan rekomendasi lengkap',
    icon: 'assessment',
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    iconCls: 'text-amber-700 dark:text-amber-300'
  }
]

onMounted(async () => {
  try {
    const { data: res } = await api.get('/ortu/dashboard')
    data.value = res
  } finally {
    loading.value = false
  }
})
</script>
