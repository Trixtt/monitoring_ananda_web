<template>
  <div class="min-h-screen flex flex-col bg-background dark:bg-deep-navy">
    <header class="bg-deep-navy text-white shadow-sm">
      <div class="container-site flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="SD Negeri 4 Keling" width="36" height="36" class="w-9 h-9 shrink-0" />
          <span class="font-headline-md text-sm">SD Negeri 4 Keling</span>
        </router-link>
      </div>
    </header>

    <div class="container-site py-8 max-w-3xl flex-1 w-full">
      <div v-if="loading"><LoadingState /></div>

      <div v-else-if="artikel">
        <router-link to="/artikel" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-6">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Daftar Berita
        </router-link>

        <div class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal mb-3">{{ artikel.kategori }}</div>
        <h1 class="font-headline-lg text-deep-navy dark:text-ice-white mb-3">{{ artikel.judul }}</h1>
        <p class="font-label-md text-outline dark:text-ice-white/50 mb-6">
          {{ tgl(artikel.publishedAt) }} &middot; Oleh {{ artikel.author?.name || 'Admin' }}
        </p>

        <div v-if="artikel.gambar" class="rounded-xl overflow-hidden mb-6 shadow-card">
          <img :src="artikel.gambar" :alt="artikel.judul" width="1200" height="600" class="w-full max-h-96 object-cover" />
        </div>

        <div class="card p-6 md:p-8 font-body-lg text-on-surface dark:text-ice-white whitespace-pre-wrap leading-8">
          {{ artikel.isi }}
        </div>

        <router-link to="/artikel" class="btn-secondary mt-8">
          <span class="material-symbols-outlined text-[18px]">article</span>
          Berita Lainnya
        </router-link>
      </div>

      <EmptyState v-else title="Artikel tidak ditemukan" icon="search_off" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const artikel = ref(null)
const loading = ref(true)

function tgl(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/artikel/${route.params.id}`)
    artikel.value = data.artikel
    if (data.artikel?.judul) {
      document.title = `${data.artikel.judul} - SD Negeri 4 Keling`
    }
  } catch {
    artikel.value = null
  } finally {
    loading.value = false
  }
})
</script>
