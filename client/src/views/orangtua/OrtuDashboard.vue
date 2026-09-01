<template>
  <div class="space-y-8">
    <div>
      <h1 class="page-title">Perkembangan Ananda</h1>
      <p class="page-subtitle">{{ data?.siswa?.nama }} &middot; Kelas {{ data?.siswa?.kelas?.nama }} &middot; {{ data?.tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="cards" /></div>

    <div v-else-if="data" class="space-y-6">
      <!-- Ringkasan perkembangan: kartu playful seragam + count-up -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <div v-for="s in statCards" :key="s.label" class="card card-hover p-6 flex flex-col">
          <span class="w-12 h-12 rounded-xl flex items-center justify-center shadow-card mb-3" :class="s.chip">
            <span class="material-symbols-outlined text-[24px] text-white">{{ s.icon }}</span>
          </span>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">{{ s.label }}</p>
          <AnimatedNumber
            v-if="s.count !== null"
            :value="s.count"
            :suffix="s.suffix"
            :decimals="s.decimals"
            class="font-headline-md text-deep-navy dark:text-ice-white leading-tight"
          />
          <p v-else class="font-headline-md text-deep-navy dark:text-ice-white leading-tight">ABK</p>
          <div v-if="s.badge" class="mt-2"><StatusBadge :kode="s.badge" /></div>
        </div>
      </div>

      <!-- Navigasi menu: chip ikon playful per kartu -->
      <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-up" style="animation-delay: 100ms">
        <router-link v-for="nav in navMenus" :key="nav.to" :to="nav.to" class="card card-hover p-5 flex flex-col group">
          <span class="w-11 h-11 rounded-xl flex items-center justify-center shadow-card mb-3" :class="nav.chip">
            <span class="material-symbols-outlined text-[22px] text-white">{{ nav.icon }}</span>
          </span>
          <p class="font-title-lg text-deep-navy dark:text-ice-white mb-1">{{ nav.label }}</p>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm mb-3">{{ nav.desc }}</p>
          <p class="font-label-sm text-dark-teal dark:text-light-teal flex items-center gap-1 mt-auto">
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
          <router-link to="/orangtua/monitoring" class="btn-ghost">
            Detail
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="(r, key) in data.ringkasKehadiran" :key="key" class="text-center rounded-lg bg-ice-white dark:bg-white/5 border border-light-teal/40 dark:border-white/10 p-4">
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
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge.vue'
import AnimatedNumber from '../../components/AnimatedNumber.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const data = ref(null)
const loading = ref(true)

const statCards = computed(() => {
  if (!data.value) return []
  const { skor } = data.value
  const abk = skor.abk
  return [
    {
      label: 'Skor SPK',
      icon: 'monitoring',
      chip: 'bg-gradient-to-br from-dark-teal to-light-teal',
      count: abk ? null : Math.round(skor.skor * 1000) / 10,
      decimals: 1,
      suffix: '',
      badge: skor.kategori.kode
    },
    {
      label: 'Nilai Akademik',
      icon: 'menu_book',
      chip: 'bg-gradient-to-br from-sky-500 to-blue-600',
      count: abk ? null : Math.round(skor.skorAkademik * 100),
      decimals: 0,
      suffix: '%'
    },
    {
      label: 'Kehadiran',
      icon: 'how_to_reg',
      chip: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      count: abk ? null : Math.round(skor.skorKehadiran * 100),
      decimals: 0,
      suffix: '%'
    },
    {
      label: 'Sikap',
      icon: 'favorite',
      chip: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      count: abk ? null : Math.round(skor.skorSikap * 100),
      decimals: 0,
      suffix: '%'
    }
  ]
})

const navMenus = [
  {
    to: '/orangtua/nilai',
    label: 'Nilai Akademik',
    desc: 'Nilai per mata pelajaran dan rata-ratanya',
    icon: 'menu_book',
    chip: 'bg-gradient-to-br from-dark-teal to-light-teal'
  },
  {
    to: '/orangtua/monitoring',
    label: 'Monitor Anak',
    desc: 'Kalender kehadiran dan sikap harian',
    icon: 'how_to_reg',
    chip: 'bg-gradient-to-br from-sky-500 to-blue-600'
  },
  {
    to: '/orangtua/rekap',
    label: 'Rekap',
    desc: 'Ringkasan skor dan rekomendasi lengkap',
    icon: 'assessment',
    chip: 'bg-gradient-to-br from-amber-400 to-orange-500'
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
