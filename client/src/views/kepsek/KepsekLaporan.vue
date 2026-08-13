<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Laporan & Riwayat</h1>
      <p class="page-subtitle">Generate laporan per kelas, kategori, dan periode waktu</p>
    </div>

    <!-- Form generate -->
    <div class="card p-6">
      <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Generate Laporan</h2>
      <form @submit.prevent="generate" class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="label" for="lbl-kelas">Kelas</label>
          <select id="lbl-kelas" v-model="filter.kelasId" class="input">
            <option :value="''">Semua Kelas</option>
            <option v-for="k in kelasOptions" :key="k.id" :value="k.id">{{ k.nama }}</option>
          </select>
        </div>
        <div>
          <label class="label" for="lbl-kategori">Kategori Kondisi</label>
          <select id="lbl-kategori" v-model="filter.kategori" class="input">
            <option value="">Semua Kondisi</option>
            <option value="aman">Baik / Aman</option>
            <option value="perhatian">Perlu Perhatian</option>
            <option value="berisiko">Berisiko</option>
            <option value="abk">ABK</option>
          </select>
        </div>
        <div>
          <label class="label" for="lbl-mulai">Periode Mulai (opsional)</label>
          <input id="lbl-mulai" v-model="filter.tanggalMulai" type="date" class="input" />
        </div>
        <div>
          <label class="label" for="lbl-akhir">Periode Sampai (opsional)</label>
          <input id="lbl-akhir" v-model="filter.tanggalAkhir" type="date" class="input" />
        </div>
        <div class="md:col-span-2">
          <label class="label" for="lbl-judul">Judul Laporan (opsional)</label>
          <input id="lbl-judul" v-model="filter.judul" class="input" placeholder="Contoh: Laporan akhir semester ganjil Kelas 5" />
        </div>
        <div class="md:col-span-2">
          <button class="btn-primary" :disabled="generating">
            <span v-if="generating" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]" v-else>auto_awesome</span>
            Generate & Simpan Laporan
          </button>
        </div>
      </form>
    </div>

    <!-- Hasil -->
    <div v-if="current" class="card overflow-hidden print-area" ref="printArea">
      <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print-header">
        <div>
          <p class="font-headline-md text-deep-navy dark:text-ice-white">SD Negeri 4 Keling</p>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ current.laporan.judul }}</p>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">
            {{ current.laporan.kelasNama }} &middot; {{ kategoriLabel(current.laporan.kategori) }} &middot; {{ periodeLabel(current.laporan) }} &middot; dibuat {{ formatTanggal(current.laporan.createdAt) }}
          </p>
        </div>
        <button class="btn-secondary print-hide" @click="cetak">
          <span class="material-symbols-outlined text-[18px]">print</span>
          Cetak
        </button>
      </div>
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>No</th>
              <th>NISN</th>
              <th>Nama</th>
              <th>Kelas</th>
              <th>Skor</th>
              <th>Mapel Terlemah</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in current.list" :key="item.siswa.id">
              <td>{{ i + 1 }}</td>
              <td>{{ item.siswa.nisn }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">
                {{ item.siswa.nama }}
                <span v-if="item.siswa.statusABK" class="badge bg-status-abk/15 text-status-abk">ABK</span>
              </td>
              <td>{{ item.siswa.kelas?.nama || '-' }}</td>
              <td>{{ item.skor.abk ? '-' : formatSkor(item.skor.skor) }}</td>
              <td class="text-on-surface-variant dark:text-ice-white/60">{{ item.mapelTerlemah || '-' }}</td>
              <td>
                <router-link :to="`/kepsek/siswa/${item.siswa.id}`" class="btn-ghost !px-2 print-hide" aria-label="Lihat detail">
                  <span class="material-symbols-outlined text-[20px]">visibility</span>
                </router-link>
              </td>
            </tr>
            <tr v-if="!current.list.length">
              <td colspan="7" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Tidak ada siswa yang cocok dengan filter</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Riwayat -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Laporan</h2>
        <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ riwayat.length }} laporan</span>
      </div>
      <div v-if="riwayatLoading"><LoadingState /></div>
      <div v-else class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Kelas</th>
              <th>Kategori</th>
              <th>Periode</th>
              <th>Siswa</th>
              <th>Tanggal</th>
              <th>Dibuat Oleh</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in riwayat" :key="l.id">
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ l.judul }}</td>
              <td>{{ l.kelasNama || 'Semua' }}</td>
              <td>{{ kategoriLabel(l.kategori) }}</td>
              <td>{{ periodeLabel(l) }}</td>
              <td class="font-label-md">{{ l.jumlah }}</td>
              <td>{{ formatTanggal(l.createdAt) }}</td>
              <td>{{ l.dibuatOleh?.name || '-' }}</td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button class="btn-ghost !px-2" aria-label="Lihat laporan" @click="lihat(l.id)">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button class="btn-ghost !px-2" aria-label="Cetak laporan" @click="cetakLaporan(l.id)">
                    <span class="material-symbols-outlined text-[20px]">print</span>
                  </button>
                  <button class="btn-ghost !px-2 text-error dark:text-red-300" aria-label="Hapus laporan" @click="hapus(l.id)">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!riwayat.length">
              <td colspan="8" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada laporan. Generate laporan pertama Anda.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { formatSkor, formatTanggal } from '../../utils/format'
import LoadingState from '../../components/LoadingState.vue'

const toast = useToastStore()

const kelasOptions = ref([])
const filter = ref({ judul: '', kelasId: '', kategori: '', tanggalMulai: '', tanggalAkhir: '' })

const current = ref(null)
const generating = ref(false)
const printArea = ref(null)

const riwayat = ref([])
const riwayatLoading = ref(true)

const kategoriLabels = {
  '': 'Semua Kondisi',
  aman: 'Baik / Aman',
  perhatian: 'Perlu Perhatian',
  berisiko: 'Berisiko',
  abk: 'ABK'
}

function kategoriLabel(k) {
  return kategoriLabels[k] || k || 'Semua Kondisi'
}

function periodeLabel(l) {
  if (!l.tanggalMulai && !l.tanggalAkhir) return 'Seluruh Periode'
  return `${l.tanggalMulai || '…'} s/d ${l.tanggalAkhir || '…'}`
}

async function loadKelas() {
  const { data } = await api.get('/kepsek/ringkasan')
  kelasOptions.value = data.perKelas.map((k) => ({ id: k.kelas.id, nama: k.kelas.nama }))
}

async function loadRiwayat() {
  riwayatLoading.value = true
  try {
    const { data } = await api.get('/kepsek/laporan')
    riwayat.value = data.list
  } finally {
    riwayatLoading.value = false
  }
}

async function generate() {
  generating.value = true
  try {
    const body = {
      judul: filter.value.judul || undefined,
      kelasId: filter.value.kelasId || undefined,
      kategori: filter.value.kategori || undefined,
      tanggalMulai: filter.value.tanggalMulai || undefined,
      tanggalAkhir: filter.value.tanggalAkhir || undefined
    }
    const { data } = await api.post('/kepsek/laporan', body)
    current.value = data
    toast.success('Laporan berhasil dibuat dan disimpan.')
    await loadRiwayat()
    scrollToResult()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal membuat laporan.')
  } finally {
    generating.value = false
  }
}

async function lihat(id) {
  try {
    const { data } = await api.get(`/kepsek/laporan/${id}`)
    current.value = data
    scrollToResult()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memuat laporan.')
  }
}

async function cetakLaporan(id) {
  try {
    const { data } = await api.get(`/kepsek/laporan/${id}`)
    current.value = data
    await nextTick()
    cetak()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memuat laporan.')
  }
}

function cetak() {
  window.print()
}

async function hapus(id) {
  if (!confirm('Hapus laporan ini dari riwayat?')) return
  try {
    await api.delete(`/kepsek/laporan/${id}`)
    toast.success('Laporan dihapus.')
    if (current.value?.laporan?.id === id) current.value = null
    await loadRiwayat()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus laporan.')
  }
}

function scrollToResult() {
  nextTick(() => {
    printArea.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

onMounted(async () => {
  await Promise.all([loadKelas(), loadRiwayat()])
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
