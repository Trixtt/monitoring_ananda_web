<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Monitoring Perkembangan</h1>
        <p class="page-subtitle">Pemantauan nilai, kehadiran, dan sikap {{ auth.role === 'admin' ? `kelas ${kelasId}` : 'kelas Anda' }} &middot; {{ data?.tahunAjaran || 'TA aktif' }}</p>
      </div>
      <select v-if="auth.role === 'admin'" :value="kelasId" class="input md:w-56" @change="setKelas($event.target.value)">
        <option :value="0" disabled>Pilih kelas</option>
        <option v-for="k in kelasOptions" :key="k.id" :value="k.id">{{ k.nama }}</option>
      </select>
    </div>

    <div v-if="loading && !data"><LoadingState skeleton variant="table" /></div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Baik / Aman" :value="ringkas.aman" icon="check_circle" tone="green" />
        <StatCard label="Perlu Perhatian" :value="ringkas.perhatian" icon="priority_high" tone="amber" />
        <StatCard label="Berisiko" :value="ringkas.berisiko" icon="warning" tone="red" />
        <StatCard label="ABK" :value="ringkas.abk" icon="accessibility_new" tone="purple" />
      </div>

      <!-- Filter -->
      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="label" for="mn-cari">Cari Siswa</label>
            <div class="relative">
              <span class="material-symbols-outlined text-[20px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-ice-white/50">search</span>
              <input id="mn-cari" v-model="cari" type="text" class="input pl-10" placeholder="Nama atau NISN" />
            </div>
          </div>
          <div>
            <label class="label" for="mn-kategori">Filter Kondisi</label>
            <select id="mn-kategori" v-model="filterKategori" class="input">
              <option value="">Semua Kondisi</option>
              <option value="aman">Baik / Aman</option>
              <option value="perhatian">Perlu Perhatian</option>
              <option value="berisiko">Berisiko</option>
              <option value="abk">ABK</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabel monitoring -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Rekap Per Siswa</h2>
          <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ filtered.length }} siswa</span>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Absen</th>
                <th>Nama</th>
                <th class="text-right">Rata Nilai</th>
                <th class="text-right">Hadir</th>
                <th class="text-right">Sikap</th>
                <th class="text-right">Jml Nilai</th>
                <th>Mapel Terlemah</th>
                <th>Kondisi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filtered" :key="item.siswa.id">
                <td>{{ item.siswa.nomorAbsen }}</td>
                <td class="font-label-md text-deep-navy dark:text-ice-white">
                  <span class="inline-flex items-center gap-2">
                    {{ item.siswa.nama }}
                    <span v-if="item.siswa.statusABK" class="badge bg-status-abk/15 text-status-abk dark:bg-status-abk/20">ABK</span>
                  </span>
                </td>
                <td class="text-right font-label-md">{{ item.skor.abk ? '-' : item.skor.detail.rataNilai }}</td>
                <td class="text-right font-label-md">{{ item.skor.abk ? '-' : persen(item.skor.skorKehadiran) }}</td>
                <td class="text-right font-label-md">{{ item.skor.abk ? '-' : item.skor.detail.rataSikap }}</td>
                <td class="text-right">{{ item.jumlahNilai }}</td>
                <td class="text-on-surface-variant dark:text-ice-white/60">{{ item.mapelTerlemah || '-' }}</td>
                <td><StatusBadge :kode="item.skor.kategori.kode" /></td>
                <td>
                  <router-link :to="`/guru/siswa/${item.siswa.id}`" class="btn-ghost !px-2" aria-label="Lihat detail">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                  </router-link>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td colspan="9" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Tidak ada siswa yang cocok dengan filter</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <EmptyState v-else title="Belum ada data" message="Pastikan kelas sudah ditentukan dan data siswa tersedia." icon="monitoring" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { persen } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const { kelasId, setKelas } = useGuruKelas()

const data = ref(null)
const loading = ref(true)
const kelasOptions = ref([])
const filterKategori = ref('')
const cari = ref('')

const ringkas = computed(() => {
  const r = { aman: 0, perhatian: 0, berisiko: 0, abk: 0, total: data.value?.list.length || 0 }
  data.value?.list.forEach((it) => {
    if (it.skor.kategori.kode in r) r[it.skor.kategori.kode]++
  })
  return r
})

const filtered = computed(() => {
  if (!data.value) return []
  let list = data.value.list
  if (filterKategori.value) {
    list = list.filter((it) => it.skor.kategori.kode === filterKategori.value)
  }
  const q = cari.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (it) => it.siswa.nama.toLowerCase().includes(q) || String(it.siswa.nisn).includes(q)
    )
  }
  return [...list].sort((a, b) => {
    const sa = a.skor.abk ? -1 : a.skor.skor
    const sb = b.skor.abk ? -1 : b.skor.skor
    return sb - sa
  })
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/guru/monitoring', { params: { kelasId: kelasId.value || undefined } })
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
