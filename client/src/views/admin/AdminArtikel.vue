<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Artikel & Berita</h1>
        <p class="page-subtitle">Kelola artikel untuk halaman depan sekolah</p>
      </div>
      <button class="btn-primary" @click="openForm()">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Tulis Artikel
      </button>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <div v-else-if="list.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="a in list" :key="a.id" class="card overflow-hidden flex flex-col">
        <div class="h-36 bg-surface-container dark:bg-white/5 overflow-hidden" :class="!a.gambar && 'flex items-center justify-center'">
          <img v-if="a.gambar" :src="a.gambar" :alt="a.judul" width="400" height="144" loading="lazy" decoding="async" class="w-full h-full object-cover" />
          <span v-else class="material-symbols-outlined text-5xl text-outline-variant">image</span>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ a.kategori }}</span>
            <span class="badge" :class="a.status === 'publish' ? 'bg-status-aman/15 text-status-aman' : 'bg-status-perhatian/20 text-yellow-700'">
              {{ a.status === 'publish' ? 'Terbit' : 'Draft' }}
            </span>
          </div>
          <h3 class="font-title-lg text-deep-navy dark:text-ice-white line-clamp-2 mb-2">{{ a.judul }}</h3>
          <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm line-clamp-2 mb-4">{{ a.isi }}</p>
          <div class="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant dark:border-white/10">
            <span class="font-label-sm text-outline dark:text-ice-white/40">{{ tgl(a.updatedAt) }}</span>
            <div class="flex gap-1">
              <button class="btn-ghost !px-2" @click="openForm(a)" aria-label="Edit">
                <span class="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button class="btn-danger-ghost !px-2" @click="askDelete(a)" aria-label="Hapus">
                <span class="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-else title="Belum ada artikel" message="Tulis artikel baru untuk ditampilkan di halaman depan." icon="article" />

    <ModalDialog v-if="form.open" :title="form.id ? 'Edit Artikel' : 'Tulis Artikel'" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Judul <span class="text-error">*</span></label>
          <input v-model="form.judul" class="input" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Kategori</label>
            <select v-model="form.kategori" class="input">
              <option v-for="k in kategoriList" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
          <div>
            <label class="label">Status</label>
            <select v-model="form.status" class="input">
              <option value="draft">Draft</option>
              <option value="publish">Terbitkan</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Isi Artikel <span class="text-error">*</span></label>
          <textarea v-model="form.isi" class="input" rows="8" required></textarea>
        </div>
        <div>
          <label class="label">Gambar Sampul</label>
          <input type="file" accept="image/*" class="input file:mr-3 file:btn-secondary" @change="onFile" />
          <img v-if="preview" :src="preview" width="400" height="128" class="mt-3 h-32 w-full object-cover rounded-lg" />
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
      :message="'Hapus artikel \u201C' + hapus.judul + '\u201D?'"
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

const toast = useToastStore()
const list = ref([])
const kategoriList = ref(['Kegiatan', 'Pengumuman', 'Prestasi', 'Tips'])
const loading = ref(true)
const saving = ref(false)
const hapus = ref(null)
const file = ref(null)
const preview = ref('')

const kosong = { open: false, id: null, judul: '', kategori: 'Kegiatan', isi: '', status: 'draft' }
const form = ref({ ...kosong })

function tgl(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openForm(a) {
  form.value = a
    ? { open: true, id: a.id, judul: a.judul, kategori: a.kategori, isi: a.isi, status: a.status }
    : { ...kosong, open: true }
  file.value = null
  preview.value = a?.gambar || ''
}

function onFile(e) {
  file.value = e.target.files[0] || null
  if (file.value) {
    preview.value = URL.createObjectURL(file.value)
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/artikel?limit=50')
    list.value = data.list
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('judul', form.value.judul)
    fd.append('kategori', form.value.kategori)
    fd.append('isi', form.value.isi)
    fd.append('status', form.value.status)
    if (file.value) fd.append('file', file.value)

    if (form.value.id) {
      await api.put(`/artikel/${form.value.id}`, fd)
      toast.success('Artikel diperbarui.')
    } else {
      await api.post('/artikel', fd)
      toast.success('Artikel disimpan.')
    }
    form.value = { ...kosong }
    file.value = null
    preview.value = ''
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan artikel.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  saving.value = true
  try {
    await api.delete(`/artikel/${hapus.value.id}`)
    toast.success('Artikel dihapus.')
    hapus.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus artikel.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/artikel/kategori')
    kategoriList.value = data.list
  } catch {}
  load()
})
</script>
