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

    <!-- Riwayat -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Laporan</h2>
        <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ riwayat.length }} laporan</span>
      </div>
      <div v-if="riwayatLoading && !riwayat.length"><LoadingState skeleton variant="table" /></div>
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
                  <router-link :to="`/kepsek/laporan/${l.id}`" class="btn-ghost !px-2" aria-label="Buka laporan">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                  </router-link>
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

    <ConfirmDialog
      v-if="hapusTarget !== null"
      message="Hapus laporan ini dari riwayat?"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="hapusTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { formatTanggal } from '../../utils/format'
import LoadingState from '../../components/LoadingState.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const router = useRouter()
const toast = useToastStore()

const kelasOptions = ref([])
const filter = ref({ judul: '', kelasId: '', kategori: '', tanggalMulai: '', tanggalAkhir: '' })

const generating = ref(false)

const riwayat = ref([])
const riwayatLoading = ref(true)
const hapusTarget = ref(null)
const deleting = ref(false)

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
    toast.success('Laporan berhasil dibuat dan disimpan.')
    router.push({ name: 'kepsek-laporan-detail', params: { id: data.laporan.id } })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal membuat laporan.')
  } finally {
    generating.value = false
  }
}

function hapus(id) {
  hapusTarget.value = id
}

async function doDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await api.delete(`/kepsek/laporan/${hapusTarget.value}`)
    toast.success('Laporan dihapus.')
    hapusTarget.value = null
    await loadRiwayat()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus laporan.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadKelas(), loadRiwayat()])
})
</script>
