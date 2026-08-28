<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="page-title">Rekap per Kelas</h1>
        <p class="page-subtitle">Kondisi siswa per kelas &middot; {{ data?.tahunAjaran || '' }}</p>
      </div>
      <div class="flex items-end gap-2">
        <label class="label !mb-1" for="tahunAjaran">Tahun Ajaran</label>
        <select id="tahunAjaran" class="input w-auto" :value="tahunAjaranId" @change="gantiTahunAjaran($event.target.value)">
          <option :value="''">Semua Tahun</option>
          <option v-for="t in daftarTahunAjaran" :key="t.id" :value="t.id">{{ t.nama }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <div v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Siswa" :value="data.total.siswa" icon="groups" tone="teal" />
        <StatCard label="Baik / Aman" :value="data.total.aman" icon="check_circle" tone="green" />
        <StatCard label="Perlu Perhatian" :value="data.total.perhatian" icon="priority_high" tone="amber" />
        <StatCard label="Berisiko" :value="data.total.berisiko" icon="warning" tone="red" />
        <StatCard label="ABK" :value="data.total.abk" icon="accessibility_new" tone="purple" />
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Daftar Kelas</h2>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Wali Kelas</th>
                <th>Aman</th>
                <th>Perhatian</th>
                <th>Berisiko</th>
                <th>ABK</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="k in data.perKelas" :key="k.kelas.id" class="cursor-pointer" @click="$router.push(`/kepsek/rekap/${k.kelas.id}?tahun=${tahunAjaranId || ''}`)">
                <td class="font-label-md text-deep-navy dark:text-ice-white">{{ k.kelas.nama }}</td>
                <td>{{ k.kelas.waliKelas || '-' }}</td>
                <td class="text-status-aman font-label-md">{{ k.aman }}</td>
                <td class="text-yellow-700 font-label-md dark:text-yellow-300">{{ k.perhatian }}</td>
                <td class="text-status-berisiko font-label-md">{{ k.berisiko }}</td>
                <td class="text-status-abk font-label-md">{{ k.abk }}</td>
                <td>
                  <span class="material-symbols-outlined text-on-surface-variant dark:text-ice-white/50">chevron_right</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <EmptyState v-else title="Belum ada data" message="Belum ada data siswa untuk ditampilkan." icon="assessment" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const data = ref(null)
const loading = ref(true)
const tahunAjaranId = ref('')
const daftarTahunAjaran = ref([])

async function load() {
  loading.value = true
  try {
    const { data: res } = await api.get('/kepsek/ringkasan', {
      params: { tahunAjaranId: tahunAjaranId.value || undefined }
    })
    data.value = res
    if (!tahunAjaranId.value && res.tahunAjaranId) tahunAjaranId.value = res.tahunAjaranId
    daftarTahunAjaran.value = res.daftarTahunAjaran || []
  } finally {
    loading.value = false
  }
}

function gantiTahunAjaran(v) {
  tahunAjaranId.value = v
  load()
}

onMounted(load)
</script>
