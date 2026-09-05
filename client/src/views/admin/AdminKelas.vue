<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Kelas</h1>
        <p class="page-subtitle">{{ list.length }} kelas terdaftar</p>
      </div>
      <button class="btn-primary" @click="openForm()">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Tambah Kelas
      </button>
    </div>

    <div v-if="loading && !list.length"><LoadingState /></div>

    <div v-else-if="list.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="k in list" :key="k.id" class="card p-5 flex flex-col">
        <div class="flex items-start justify-between mb-3">
          <span class="w-11 h-11 rounded-xl bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal flex items-center justify-center">
            <span class="material-symbols-outlined">door_sliding</span>
          </span>
          <div class="flex gap-1">
            <button class="btn-ghost !px-2" @click="openForm(k)" aria-label="Edit">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button class="btn-danger-ghost !px-2" @click="askDelete(k)" aria-label="Hapus">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-1">{{ k.nama }}</h2>
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Tingkat {{ k.tingkat }}</p>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm mb-4">
          Wali Kelas: {{ k.waliKelas || 'Belum ditentukan' }}
        </p>
        <div class="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant dark:border-white/10">
          <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ k.siswaCount }} siswa</span>
          <router-link :to="`/admin/guru/${k.id}`" class="btn-secondary !py-1.5">
            <span class="material-symbols-outlined text-[18px]">visibility</span>
            Masuk sebagai Wali
          </router-link>
        </div>
      </div>
    </div>

    <EmptyState v-else title="Belum ada kelas" message="Tambahkan kelas baru." icon="door_sliding" />

    <ModalDialog v-if="form.open" :title="form.id ? 'Edit Kelas' : 'Tambah Kelas'" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nama Kelas <span class="text-error">*</span></label>
          <input v-model="form.nama" class="input" placeholder="Contoh: Kelas 1" required />
        </div>
        <div>
          <label class="label">Tingkat <span class="text-error">*</span></label>
          <select v-model="form.tingkat" class="input">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
            <option :value="5">5</option>
            <option :value="6">6</option>
          </select>
        </div>
        <div>
          <label class="label">Nama Wali Kelas</label>
          <input v-model="form.waliKelas" class="input" placeholder="Contoh: Budi Santoso, S.Pd" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="form.open = false">Batal</button>
          <button class="btn-primary" :disabled="saving">Simpan</button>
        </div>
      </form>
    </ModalDialog>

    <ConfirmDialog
      v-if="hapus"
      :message="`Hapus kelas ${hapus.nama}?`"
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
const loading = ref(true)
const saving = ref(false)
const hapus = ref(null)
const kosong = { open: false, id: null, nama: '', tingkat: 1, waliKelas: '' }
const form = ref({ ...kosong })

function openForm(k) {
  form.value = k ? { ...kosong, open: true, id: k.id, nama: k.nama, tingkat: k.tingkat, waliKelas: k.waliKelas || '' } : { ...kosong, open: true }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/kelas')
    list.value = data.list
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/admin/kelas/${form.value.id}`, form.value)
      toast.success('Kelas diperbarui.')
    } else {
      await api.post('/admin/kelas', form.value)
      toast.success('Kelas ditambahkan.')
    }
    form.value = { ...kosong }
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan kelas.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  saving.value = true
  try {
    await api.delete(`/admin/kelas/${hapus.value.id}`)
    toast.success('Kelas dihapus.')
    hapus.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus kelas.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
