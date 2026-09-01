<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Dashboard Kelas</h1>
        <p class="page-subtitle">Rekap kondisi siswa {{ auth.role === 'admin' ? `kelas ${kelasId}` : 'kelas Anda' }} &middot; {{ data?.tahunAjaran || 'TA aktif' }}</p>
      </div>
      <select v-if="auth.role === 'admin'" :value="kelasId" class="input md:w-56" @change="setKelas($event.target.value)">
        <option :value="0" disabled>Pilih kelas</option>
        <option v-for="k in kelasOptions" :key="k.id" :value="k.id">{{ k.nama }}</option>
      </select>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="cards" /></div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Baik / Aman" :value="data.ringkas.aman" icon="check_circle" tone="green" />
        <StatCard label="Perlu Perhatian" :value="data.ringkas.perhatian" icon="priority_high" tone="amber" />
        <StatCard label="Berisiko" :value="data.ringkas.berisiko" icon="warning" tone="red" />
        <StatCard label="ABK" :value="data.ringkas.abk" icon="accessibility_new" tone="purple" />
      </div>

      <!-- Daftar siswa -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Daftar Siswa</h2>
          <router-link to="/guru/siswa" class="btn-ghost">
            Kelola
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </router-link>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Absen</th>
                <th>Nama</th>
                <th>Skor</th>
                <th>Kondisi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.list" :key="item.siswa.id" class="cursor-pointer" @click="$router.push(`/guru/siswa/${item.siswa.id}`)">
                <td>{{ item.siswa.nomorAbsen }}</td>
                <td class="font-label-md text-deep-navy dark:text-ice-white">
                  <span class="inline-flex items-center gap-2">
                    {{ item.siswa.nama }}
                    <span v-if="item.siswa.statusABK" class="badge bg-status-abk/15 text-status-abk dark:bg-status-abk/20">ABK</span>
                  </span>
                </td>
                <td>{{ item.hasil.abk ? '-' : formatSkor(item.hasil.skor) }}</td>
                <td><StatusBadge :kode="item.hasil.kategori.kode" /></td>
                <td>
                  <span class="material-symbols-outlined text-on-surface-variant dark:text-ice-white/50">chevron_right</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <EmptyState v-else title="Belum ada data" message="Pastikan kelas sudah ditentukan dan data siswa tersedia." icon="groups" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { formatSkor } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const { kelasId, setKelas } = useGuruKelas()

const data = ref(null)
const loading = ref(true)
const kelasOptions = ref([])

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/guru/dashboard', { params: { kelasId: kelasId.value || undefined } })
    data.value = res
  } finally {
    loading.value = false
  }
}

async function loadKelas() {
  const { data: res } = await api.get('/guru/kelas')
  kelasOptions.value = res.list
  if (auth.role === 'admin' && !kelasId.value && res.list.length) {
    setKelas(res.list[0].id)
  }
}

onMounted(() => {
  loadKelas()
  load()
})

watch(kelasId, () => load())
</script>
