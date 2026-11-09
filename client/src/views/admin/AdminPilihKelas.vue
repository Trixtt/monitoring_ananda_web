<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Masuk sebagai Guru</h1>
      <p class="page-subtitle">Pilih kelas untuk mengelola nilai, kehadiran, dan sikap sebagai wali kelas.</p>
    </div>

    <div v-if="loading && !list.length"><LoadingState /></div>

    <div v-else-if="list.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="k in list" :key="k.id" class="card p-5 flex flex-col">
        <div class="flex items-start justify-between mb-3">
          <span class="w-11 h-11 rounded-xl bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal flex items-center justify-center">
            <span class="material-symbols-outlined">door_sliding</span>
          </span>
        </div>
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">{{ k.nama }}</h2>
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Tingkat {{ k.tingkat }}</p>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm mb-4">
          Wali Kelas: {{ k.waliKelas || 'Belum ditentukan' }}
        </p>
        <div class="mt-auto pt-3 border-t border-surface-variant dark:border-white/10 space-y-3">
          <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ k.siswaCount }} siswa</span>
          <button class="btn-primary w-full !px-3 !py-2" @click="pilih(k)">
            Masuk sebagai Guru
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="Belum ada kelas"
      message="Buat kelas terlebih dahulu di menu Kelas sebelum masuk sebagai guru."
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