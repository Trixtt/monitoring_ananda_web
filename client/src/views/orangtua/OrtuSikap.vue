<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Catatan Sikap</h1>
      <p class="page-subtitle">{{ siswa?.nama }} &middot; Kelas {{ siswa?.kelas?.nama }} &middot; {{ tahunAjaran || '' }}</p>
    </div>

    <div v-if="loading && !list.length"><LoadingState /></div>

    <template v-else>
      <div class="card p-6">
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Skor Berdasarkan Catatan</p>
        <p class="font-headline-lg text-deep-navy dark:text-ice-white">{{ ringkas.nilai }}</p>
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
          {{ ringkas.jumlahCatatan }} catatan pada semester ini. Skor dihitung dari 100 dikurangi pengurangan catatan
          yang tersimpan.
        </p>
        <p v-if="ringkas.tanpaCatatan" class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
          Belum ada catatan kejadian pada periode ini. Catatan dibuat hanya ketika ada kejadian yang perlu disampaikan.
        </p>
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Catatan Sikap</h2>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis Kejadian</th>
                <th>Aspek</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in list" :key="s.id">
                <td>{{ formatTanggal(s.tanggal) }}</td>
                <td class="font-label-md text-deep-navy dark:text-ice-white">{{ s.kategori }}</td>
                <td class="capitalize">{{ s.aspek }}</td>
                <td>{{ s.keterangan || '-' }}</td>
              </tr>
              <tr v-if="!list.length">
                <td colspan="4" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">
                  Belum ada catatan kejadian pada periode ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { formatTanggal } from '../../utils/format'
import { useOrtuProfil } from '../../composables/useOrtuProfil'
import LoadingState from '../../components/LoadingState.vue'

const { siswa, tahunAjaran } = useOrtuProfil()

const ringkas = ref({ nilai: 100, jumlahCatatan: 0, tanpaCatatan: true })
const list = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/ortu/sikap')
    ringkas.value = data.ringkas
    list.value = data.list
  } finally {
    loading.value = false
  }
})
</script>
