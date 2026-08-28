<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Rekap Kelas {{ kelas?.nama || '' }}</h1>
        <p class="page-subtitle">{{ kelas?.waliKelas ? `Wali Kelas: ${kelas.waliKelas}` : '' }} &middot; {{ data?.tahunAjaran || '' }}</p>
      </div>
      <router-link to="/kepsek/rekap" class="btn-ghost">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Semua Kelas
      </router-link>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Baik / Aman" :value="data.ringkas.aman" icon="check_circle" tone="green" />
        <StatCard label="Perlu Perhatian" :value="data.ringkas.perhatian" icon="priority_high" tone="amber" />
        <StatCard label="Berisiko" :value="data.ringkas.berisiko" icon="warning" tone="red" />
        <StatCard label="ABK" :value="data.ringkas.abk" icon="accessibility_new" tone="purple" />
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Siswa Kelas {{ kelas.nama }}</h2>
          <button class="btn-secondary" :disabled="!data.list.length" @click="exportData">
            <span class="material-symbols-outlined text-[18px]">download</span>
            Ekspor CSV
          </button>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Absen</th>
                <th>NISN</th>
                <th>Nama</th>
                <th>Skor</th>
                <th>Kondisi</th>
                <th>Mapel Terlemah</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.list" :key="item.siswa.id">
                <td>{{ item.siswa.nomorAbsen }}</td>
                <td>{{ item.siswa.nisn }}</td>
                <td class="font-label-md text-deep-navy dark:text-ice-white">
                  <span class="inline-flex items-center gap-2">
                    {{ item.siswa.nama }}
                    <span v-if="item.siswa.statusABK" class="badge bg-status-abk/15 text-status-abk dark:bg-status-abk/20">ABK</span>
                  </span>
                </td>
                <td>{{ item.skor.abk ? '-' : formatSkor(item.skor.skor) }}</td>
                <td><StatusBadge :kode="item.skor.kategori.kode" /></td>
                <td class="text-on-surface-variant dark:text-ice-white/60">{{ item.mapelTerlemah || '-' }}</td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <router-link :to="`/kepsek/rapor/${item.siswa.id}?from=/kepsek/rekap/${route.params.kelasId}`" class="btn-ghost !px-2" aria-label="Cetak rapor">
                      <span class="material-symbols-outlined text-[20px]">description</span>
                    </router-link>
                    <router-link :to="`/kepsek/siswa/${item.siswa.id}`" class="btn-ghost !px-2" aria-label="Lihat detail">
                      <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </router-link>
                  </div>
                </td>
              </tr>
              <tr v-if="!data.list.length">
                <td colspan="7" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada siswa di kelas ini</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <EmptyState v-else title="Kelas tidak ditemukan" message="Pastikan kelas sudah dibuat dan memiliki siswa." icon="door_sliding" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { formatSkor } from '../../utils/format'
import { exportCsv } from '../../utils/exportCsv'
import StatusBadge from '../../components/StatusBadge.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const route = useRoute()

const data = ref(null)
const loading = ref(true)

const kelas = ref(null)

const LABEL_KONDISI = {
  aman: 'Aman',
  perhatian: 'Perlu Perhatian',
  berisiko: 'Berisiko',
  abk: 'ABK'
}

function exportData() {
  const rows = data.value.list.map((item) => [
    item.siswa.nomorAbsen,
    item.siswa.nisn,
    item.siswa.nama,
    item.skor.abk ? '' : formatSkor(item.skor.skor),
    LABEL_KONDISI[item.skor.kategori.kode] || item.skor.kategori.kode,
    item.mapelTerlemah || ''
  ])
  exportCsv(`rekap-${kelas.value.nama}.csv`.replace(/[^\w-]+/g, '-'), ['Absen', 'NISN', 'Nama', 'Skor', 'Kondisi', 'Mapel Terlemah'], rows)
}

onMounted(async () => {
  try {
    const { data: res } = await api.get(`/kepsek/kelas/${route.params.kelasId}`, {
      params: { tahunAjaranId: route.query.tahun || undefined }
    })
    data.value = res
    kelas.value = res.kelas
  } finally {
    loading.value = false
  }
})
</script>
