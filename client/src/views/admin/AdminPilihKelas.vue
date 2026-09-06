<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Masuk sebagai Wali Kelas</h1>
      <p class="page-subtitle">Pilih kelas untuk mengelola nilai, kehadiran, dan sikap atas nama wali kelas.</p>
    </div>

    <div v-if="loading && !list.length"><LoadingState skeleton variant="cards" /></div>

    <div v-else-if="list.length">
      <p class="font-label-sm text-outline dark:text-ice-white/40 mb-3">
        Setelah memilih kelas, menu wali kelas akan muncul di sidebar.
      </p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <button
          v-for="k in list"
          :key="k.id"
          class="card p-5 text-left hover:shadow-lift transition-shadow group"
          @click="pilih(k)"
        >
          <span class="material-symbols-outlined text-dark-teal block mb-3 text-3xl group-hover:text-light-teal transition-colors">door_sliding</span>
          <p class="font-title-lg text-deep-navy dark:text-ice-white">{{ k.nama }}</p>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">{{ k.waliKelas ? `Wali kelas: ${k.waliKelas}` : 'Belum ada wali kelas' }}</p>
          <span class="inline-flex items-center gap-1 mt-3 text-dark-teal dark:text-light-teal font-label-sm">
            Masuk
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </button>
      </div>
    </div>

    <EmptyState
      v-else
      title="Belum ada kelas"
      message="Buat kelas terlebih dahulu di menu Kelas sebelum membantu wali kelas."
      icon="door_sliding"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { setKelas } = useGuruKelas()

const list = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/admin/kelas')
    list.value = res.list || []
  } finally {
    loading.value = false
  }
}

function pilih(k) {
  setKelas(k.id)
}

onMounted(load)
</script>