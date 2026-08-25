<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Dashboard Admin</h1>
      <p class="page-subtitle">Ringkasan data sekolah</p>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="cards" /></div>  

    <div v-else class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-up">
    <StatCard label="Total Siswa" :value="d.siswa" icon="groups" tone="teal" />
    <StatCard label="Kelas" :value="d.kelas" icon="door_sliding" tone="blue" />
    <StatCard label="Akun Pengguna" :value="d.akun" icon="manage_accounts" tone="green" />
    <StatCard label="Mata Pelajaran" :value="d.mapel" icon="menu_book" tone="amber" />
    <StatCard label="Artikel" :value="d.artikel" icon="article" tone="purple" />
      </div>

      <div class="grid md:grid-cols-2 gap-6 animate-fade-up" style="animation-delay: 100ms">
        <router-link to="/admin/akun" class="card p-6 hover:shadow-lift transition-shadow group">
          <span class="material-symbols-outlined text-dark-teal block mb-3 text-3xl group-hover:text-light-teal transition-colors">manage_accounts</span>
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">Manajemen Akun</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm">Buat akun wali kelas, orang tua, dan reset password.</p>
        </router-link>
        <router-link to="/admin/spk" class="card p-6 hover:shadow-lift transition-shadow group">
          <span class="material-symbols-outlined text-dark-teal block mb-3 text-3xl group-hover:text-light-teal transition-colors">tune</span>
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">Konfigurasi SPK</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm">Atur bobot akademik, kehadiran, sikap, dan interval klasifikasi.</p>
        </router-link>
        <router-link to="/admin/siswa" class="card p-6 hover:shadow-lift transition-shadow group">
          <span class="material-symbols-outlined text-dark-teal block mb-3 text-3xl group-hover:text-light-teal transition-colors">groups</span>
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">Data Siswa</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm">Kelola data induk siswa, kelas, dan tahun ajaran.</p>
        </router-link>
        <router-link to="/admin/artikel" class="card p-6 hover:shadow-lift transition-shadow group">
          <span class="material-symbols-outlined text-dark-teal block mb-3 text-3xl group-hover:text-light-teal transition-colors">article</span>
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">Artikel & Berita</h2>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm">Tulis dan terbitkan berita untuk halaman depan.</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'

const d = ref({ siswa: 0, kelas: 0, akun: 0, mapel: 0, artikel: 0 })
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/ringkasan')
    d.value = data
  } finally {
    loading.value = false
  }
})
</script>
