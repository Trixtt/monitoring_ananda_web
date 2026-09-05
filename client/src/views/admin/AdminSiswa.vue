<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Data Siswa</h1>
        <p class="page-subtitle">{{ total }} siswa terdaftar</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary" :disabled="!list.length" @click="exportData">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Ekspor CSV
        </button>
        <button class="btn-primary" @click="openForm()">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Tambah Siswa
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3">
      <input v-model="q" class="input md:w-64" placeholder="Cari nama..." @keyup.enter="applyFilter" />
      <select v-model="fKelas" class="input md:w-48" @change="applyFilter">
        <option value="">Semua Kelas</option>
        <option v-for="k in kelasList" :key="k.id" :value="k.id">{{ k.nama }}</option>
      </select>
      <select v-model="fTA" class="input md:w-48" @change="applyFilter">
        <option value="">Semua Tahun Ajaran</option>
        <option v-for="t in taList" :key="t.id" :value="t.id">{{ t.nama }}</option>
      </select>
      <button class="btn-secondary" @click="applyFilter">
        <span class="material-symbols-outlined text-[18px]">search</span>
      </button>
    </div>

    <div v-if="loading && !list.length"><LoadingState skeleton variant="table" /></div>

    <div v-else-if="list.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>NISN</th>
              <th>Nama</th>
              <th>L/P</th>
              <th>Kelas</th>
              <th>Absen</th>
              <th>TA</th>
              <th>ABK</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in list" :key="s.id">
              <td>{{ s.nisn }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ s.nama }}</td>
              <td>{{ s.jenisKelamin }}</td>
              <td>{{ s.kelas?.nama || '-' }}</td>
              <td>{{ s.nomorAbsen }}</td>
              <td>{{ s.tahunAjaran?.nama || '-' }}</td>
              <td>
                <span v-if="s.statusABK" class="badge bg-status-abk/15 text-status-abk">ABK</span>
                <span v-else class="font-label-sm text-outline dark:text-ice-white/40">Tidak</span>
              </td>
              <td class="whitespace-nowrap">
                <button class="btn-ghost !px-2" @click="openForm(s)" aria-label="Edit">
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="btn-danger-ghost !px-2" @click="askDelete(s)" aria-label="Hapus">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar :total="total" :page="page" :per-page="perPage" @change="goPage" />
    </div>

    <EmptyState v-else title="Belum ada siswa" message="Tambahkan data siswa atau ubah kata kunci pencarian." icon="groups" />

    <ModalDialog v-if="form.id !== null || form.open" :title="form.id ? 'Edit Siswa' : 'Tambah Siswa'" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">NISN <span class="text-error">*</span></label>
          <input v-model="form.nisn" class="input" required />
        </div>
        <div>
          <label class="label">Nama Lengkap <span class="text-error">*</span></label>
          <input v-model="form.nama" class="input" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Jenis Kelamin</label>
            <select v-model="form.jenisKelamin" class="input">
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div>
            <label class="label">Tanggal Lahir</label>
            <input v-model="form.tanggalLahir" type="date" class="input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Kelas <span class="text-error">*</span></label>
            <select v-model="form.kelasId" class="input" required>
              <option :value="null" disabled>Pilih kelas</option>
              <option v-for="k in kelasList" :key="k.id" :value="k.id">{{ k.nama }}</option>
            </select>
          </div>
          <div>
            <label class="label">Tahun Ajaran</label>
            <select v-model="form.tahunAjaranId" class="input">
              <option :value="null">Pilih TA</option>
              <option v-for="t in taList" :key="t.id" :value="t.id">{{ t.nama }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nomor Absen</label>
            <input v-model="form.nomorAbsen" type="number" min="1" class="input" />
          </div>
          <div>
            <label class="label">Tahun Angkatan</label>
            <input v-model="form.tahunAngkatan" type="number" class="input" placeholder="2025" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input id="abk" v-model="form.statusABK" type="checkbox" class="accent-dark-teal" />
          <label for="abk" class="font-label-md text-on-surface-variant dark:text-ice-white/60">Status ABK</label>
        </div>
        <div v-if="form.statusABK">
          <label class="label">Catatan ABK</label>
          <textarea v-model="form.catatanABK" class="input" rows="2" placeholder="Jenis kebutuhan khusus..."></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="form.open = false">Batal</button>
          <button class="btn-primary" :disabled="saving">
            <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]" v-else>save</span>
            Simpan
          </button>
        </div>
      </form>
    </ModalDialog>

    <ConfirmDialog
      v-if="hapus"
      :message="`Hapus siswa ${hapus.nama}? Data nilai, kehadiran, dan sikap terkait ikut terhapus.`"
      :loading="saving"
      @confirm="doDelete"
      @cancel="hapus = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../stores/toast'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { exportCsv } from '../../utils/exportCsv'

const toast = useToastStore()

const list = ref([])
const kelasList = ref([])
const taList = ref([])
const loading = ref(true)
const saving = ref(false)
const q = ref('')
const fKelas = ref('')
const fTA = ref('')
const page = ref(1)
const perPage = ref(25)
const total = ref(0)
const hapus = ref(null)

const kosong = { open: false, id: null, nisn: '', nama: '', jenisKelamin: 'L', tanggalLahir: '', kelasId: null, tahunAjaranId: null, nomorAbsen: '', tahunAngkatan: '', statusABK: false, catatanABK: '' }
const form = ref({ ...kosong })

function openForm(s) {
  form.value = s
    ? { ...kosong, open: true, id: s.id, nisn: s.nisn, nama: s.nama, jenisKelamin: s.jenisKelamin || 'L', tanggalLahir: s.tanggalLahir || '', kelasId: s.kelasId, tahunAjaranId: s.tahunAjaranId, nomorAbsen: s.nomorAbsen, tahunAngkatan: s.tahunAngkatan, statusABK: s.statusABK, catatanABK: s.catatanABK || '' }
    : { ...kosong, open: true }
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: perPage.value }
    if (q.value) params.q = q.value
    if (fKelas.value) params.kelasId = fKelas.value
    if (fTA.value) params.tahunAjaranId = fTA.value
    const { data } = await api.get('/admin/siswa', { params })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  page.value = 1
  load()
}

function goPage(p) {
  page.value = p
  load()
}

async function exportData() {
  try {
    const params = { limit: 10000 }
    if (q.value) params.q = q.value
    if (fKelas.value) params.kelasId = fKelas.value
    if (fTA.value) params.tahunAjaranId = fTA.value
    const { data } = await api.get('/admin/siswa', { params })
    const rows = data.list.map((s) => [
      s.nomorAbsen,
      s.nisn,
      s.nama,
      s.jenisKelamin,
      s.kelas?.nama || '',
      s.tahunAjaran?.nama || '',
      s.statusABK ? 'Ya' : 'Tidak'
    ])
    exportCsv('data-siswa.csv', ['Absen', 'NISN', 'Nama', 'L/P', 'Kelas', 'Tahun Ajaran', 'ABK'], rows)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengekspor data siswa.')
  }
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value }
    delete payload.open
    if (form.value.id) {
      await api.put(`/admin/siswa/${form.value.id}`, payload)
      toast.success('Data siswa diperbarui.')
    } else {
      await api.post('/admin/siswa', payload)
      toast.success('Siswa ditambahkan.')
    }
    form.value = { ...kosong }
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan data siswa.')
  } finally {
    saving.value = false
  }
}

function askDelete(s) {
  hapus.value = s
}

async function doDelete() {
  saving.value = true
  try {
    await api.delete(`/admin/siswa/${hapus.value.id}`)
    toast.success('Siswa dihapus.')
    hapus.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus siswa.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [k, t] = await Promise.all([
    api.get('/admin/kelas'),
    api.get('/admin/tahun-ajaran')
  ])
  kelasList.value = k.data.list
  taList.value = t.data.list
  load()
})
</script>
