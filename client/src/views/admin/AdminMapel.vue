<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Mata Pelajaran</h1>
        <p class="page-subtitle">{{ list.length }} mapel terdaftar</p>
      </div>
      <button class="btn-primary" @click="openForm()">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Tambah Mapel
      </button>
    </div>

    <div v-if="loading && !list.length"><LoadingState /></div>

    <div v-else-if="list.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Mata Pelajaran</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, i) in list" :key="m.id">
              <td>{{ i + 1 }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ m.nama }}</td>
              <td class="text-right whitespace-nowrap">
                <button class="btn-ghost !px-2" @click="openForm(m)" aria-label="Edit">
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="btn-danger-ghost !px-2" @click="askDelete(m)" aria-label="Hapus">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else title="Belum ada mapel" message="Tambahkan mata pelajaran baru." icon="menu_book" />

    <ModalDialog v-if="form.open" :title="form.id ? 'Edit Mapel' : 'Tambah Mapel'" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nama Mata Pelajaran <span class="text-error">*</span></label>
          <input v-model="form.nama" class="input" required />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="form.open = false">Batal</button>
          <button class="btn-primary" :disabled="saving">Simpan</button>
        </div>
      </form>
    </ModalDialog>

    <ConfirmDialog
      v-if="hapus"
      :message="`Hapus mapel ${hapus.nama}? Nilai terkait ikut terhapus.`"
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
const kosong = { open: false, id: null, nama: '' }
const form = ref({ ...kosong })

function openForm(m) {
  form.value = m ? { ...kosong, open: true, id: m.id, nama: m.nama } : { ...kosong, open: true }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/mapel')
    list.value = data.list
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/admin/mapel/${form.value.id}`, form.value)
      toast.success('Mapel diperbarui.')
    } else {
      await api.post('/admin/mapel', form.value)
      toast.success('Mapel ditambahkan.')
    }
    form.value = { ...kosong }
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan mapel.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  saving.value = true
  try {
    await api.delete(`/admin/mapel/${hapus.value.id}`)
    toast.success('Mapel dihapus.')
    hapus.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus mapel.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
