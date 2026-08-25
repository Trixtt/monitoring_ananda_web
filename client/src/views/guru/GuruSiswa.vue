<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Data Siswa</h1>
        <p class="page-subtitle">Rekap skor dan kondisi siswa dalam satu kelas</p>
      </div>
      <select v-if="auth.role === 'admin'" :value="kelasId" class="input md:w-56" @change="setKelas($event.target.value)">
        <option :value="0" disabled>Pilih kelas</option>
        <option v-for="k in kelasOptions" :key="k.id" :value="k.id">{{ k.nama }}</option>
      </select>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <div v-else-if="list.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Absen</th>
              <th>NISN</th>
              <th>Nama</th>
              <th>L/P</th>
              <th>Skor SPK</th>
              <th>Kondisi</th>
              <th>Mapel Terlemah</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.siswa.id" class="cursor-pointer" @click="$router.push(`/guru/siswa/${item.siswa.id}`)">
              <td>{{ item.siswa.nomorAbsen }}</td>
              <td>{{ item.siswa.nisn }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">
                <span class="inline-flex items-center gap-2">
                  {{ item.siswa.nama }}
                  <span v-if="item.siswa.statusABK" class="badge bg-status-abk/15 text-status-abk">ABK</span>
                </span>
              </td>
              <td>{{ item.siswa.jenisKelamin }}</td>
              <td class="font-label-md">{{ item.skor.abk ? '-' : formatSkor(item.skor.skor) }}</td>
              <td><StatusBadge :kode="item.skor.kategori.kode" /></td>
              <td class="text-on-surface-variant dark:text-ice-white/60">{{ item.skor.abk ? '-' : (item.skor.detail?.rataNilai ? '—' : 'Belum ada nilai') }}</td>
              <td>
                <span class="material-symbols-outlined text-on-surface-variant dark:text-ice-white/60">chevron_right</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else title="Belum ada siswa" message="Belum ada data siswa pada kelas ini." icon="groups" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { formatSkor } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const { kelasId, setKelas } = useGuruKelas()

const list = ref([])
const loading = ref(true)
const kelasOptions = ref([])

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/guru/siswa', { params: { kelasId: kelasId.value || undefined } })
    list.value = res.list
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const { data: res } = await api.get('/guru/kelas')
  kelasOptions.value = res.list
  if (auth.role === 'admin' && !kelasId.value && res.list.length) setKelas(res.list[0].id)
  load()
})

watch(kelasId, () => load())
</script>
