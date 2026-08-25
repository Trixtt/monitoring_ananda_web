<template>
  <div class="min-h-screen flex flex-col bg-background dark:bg-deep-navy">
    <header class="bg-deep-navy text-white shadow-sm">
      <div class="container-site flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="SD Negeri 4 Keling" width="36" height="36" class="w-9 h-9 shrink-0" />
          <span class="font-headline-md text-sm">SD Negeri 4 Keling</span>
        </router-link>
        <div class="flex items-center gap-2">
          <router-link to="/login" v-if="!auth.isAuthenticated" class="btn-primary">
            <span class="material-symbols-outlined text-[18px]">login</span>
            Masuk
          </router-link>
          <router-link v-else :to="auth.homePath" class="btn-primary">
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </router-link>
        </div>
      </div>
    </header>

    <div class="container-site py-8 flex-1">
      <router-link to="/" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-6">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Beranda
      </router-link>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="page-title">Berita Sekolah</h1>
          <p class="page-subtitle">Pengumuman, kegiatan, dan prestasi SD Negeri 4 Keling</p>
        </div>
        <div class="flex gap-3">
          <input
            v-model="q"
            class="input md:w-56"
            placeholder="Cari berita..."
            @keyup.enter="load(1)"
          />
          <select v-model="kategori" class="input md:w-48" @change="load(1)">
            <option value="">Semua Kategori</option>
            <option v-for="k in kategoriList" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="grid md:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="card h-72 animate-pulse bg-surface-container-low dark:bg-white/5 dark:bg-white/5"></div>
      </div>

      <div v-else-if="list.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="a in list"
          :key="a.id"
          :to="`/artikel/${a.id}`"
          class="card card-hover overflow-hidden group"
        >
          <div class="h-40 bg-surface-container dark:bg-white/5 dark:bg-white/5 overflow-hidden" :class="!a.gambar && 'flex items-center justify-center'">
            <img v-if="a.gambar" :src="a.gambar" :alt="a.judul" width="400" height="160" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <span v-else class="material-symbols-outlined text-5xl text-outline-variant dark:text-white/20">image</span>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ a.kategori }}</span>
              <span class="font-label-sm text-outline dark:text-ice-white/40">{{ tgl(a.publishedAt) }}</span>
            </div>
            <h3 class="font-title-lg text-deep-navy dark:text-ice-white line-clamp-2 mb-2 group-hover:text-dark-teal dark:group-hover:text-light-teal transition-colors">{{ a.judul }}</h3>
            <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm line-clamp-2">{{ a.isi }}</p>
            <p class="font-label-sm text-outline dark:text-ice-white/40 mt-3">Oleh: {{ a.author?.name || 'Admin' }}</p>
          </div>
        </router-link>
      </div>

      <EmptyState
        v-else
        title="Berita tidak ditemukan"
        message="Tidak ada artikel yang sesuai dengan pencarian atau kategori ini."
        icon="search_off"
      />

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
        <button class="btn-secondary" :disabled="page <= 1" @click="load(page - 1)">
          <span class="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span class="font-label-md text-on-surface-variant dark:text-ice-white/60 px-2">Halaman {{ page }} dari {{ totalPages }}</span>
        <button class="btn-secondary" :disabled="page >= totalPages" @click="load(page + 1)">
          <span class="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>

    <footer class="bg-deep-navy text-ice-white/60 py-6 mt-8">
      <div class="container-site text-sm">&copy; {{ new Date().getFullYear() }} SD Negeri 4 Keling</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const list = ref([])
const kategoriList = ref([])
const q = ref('')
const kategori = ref('')
const page = ref(1)
const totalPages = ref(1)
const loading = ref(true)

function tgl(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load(p) {
  loading.value = true
  try {
    const params = new URLSearchParams({ status: 'publish', page: p })
    if (q.value) params.set('q', q.value)
    if (kategori.value) params.set('kategori', kategori.value)
    const { data } = await api.get(`/artikel?${params}`)
    list.value = data.list
    page.value = data.page
    totalPages.value = data.pages
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  load(1)
  try {
    const { data } = await api.get('/artikel/kategori')
    kategoriList.value = data.list
  } catch {
    // gagal memuat kategori — abaikan
  }
})
</script>
