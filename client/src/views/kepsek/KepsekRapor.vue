<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <router-link :to="backTo" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-3">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </router-link>
        <h1 class="page-title">Rapor Siswa</h1>
        <p class="page-subtitle">{{ data?.siswa?.nama || '' }} &middot; Kelas {{ data?.siswa?.kelas?.nama || '' }} &middot; {{ data?.tahunAjaran || '' }}</p>
      </div>
      <button v-if="data" class="btn-secondary print-hide" @click="cetak">
        <span class="material-symbols-outlined text-[18px]">print</span>
        Cetak Rapor
      </button>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <RaporCard v-else-if="data" :rapor="data" />

    <EmptyState v-else title="Siswa tidak ditemukan" message="Pastikan siswa masih terdaftar dan memiliki data." icon="search_off" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import RaporCard from '../../components/RaporCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()
const data = ref(null)
const loading = ref(true)

const backTo = computed(() => route.query.from || `/kepsek/siswa/${route.params.siswaId}`)

function cetak() {
  window.print()
}

onMounted(async () => {
  try {
    const { data: res } = await api.get(`/kepsek/rapor/${route.params.siswaId}`)
    data.value = res.rapor
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area,
  .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    inset: 0;
    box-shadow: none;
    border: none;
  }
  .print-hide {
    display: none !important;
  }
}
</style>
