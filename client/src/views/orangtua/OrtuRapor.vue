<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Rapor Perkembangan</h1>
        <p class="page-subtitle">{{ data?.siswa?.nama || 'Ananda' }} &middot; Kelas {{ data?.siswa?.kelas?.nama || '' }} &middot; {{ data?.tahunAjaran || '' }}</p>
      </div>
      <button v-if="data" class="btn-secondary print-hide" @click="cetak">
        <span class="material-symbols-outlined text-[18px]">print</span>
        Cetak Rapor
      </button>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <RaporCard v-else-if="data" :rapor="data" />

    <EmptyState v-else title="Data belum tersedia" message="Data siswa belum tertaut ke akun Anda. Hubungi admin sekolah." icon="description" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import RaporCard from '../../components/RaporCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const data = ref(null)
const loading = ref(true)

function cetak() {
  window.print()
}

onMounted(async () => {
  try {
    const { data: res } = await api.get('/ortu/rapor')
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
