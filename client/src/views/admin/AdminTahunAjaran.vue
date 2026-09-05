<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Tahun Ajaran</h1>
        <p class="page-subtitle">Kelola periode tahun ajaran aktif</p>
      </div>
      <button class="btn-primary" @click="openForm()">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Tambah Tahun Ajaran
      </button>
    </div>

    <div v-if="loading && !list.length"><LoadingState /></div>

    <div v-else-if="list.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Nama Tahun Ajaran</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in list" :key="t.id">
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ t.nama }}</td>
              <td>
                <span v-if="t.isActive" class="badge bg-status-aman/15 text-status-aman">Aktif</span>
                <span v-else class="badge bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-ice-white/60">Tidak aktif</span>
              </td>
              <td class="text-right whitespace-nowrap">
                <button v-if="!t.isActive" class="btn-secondary !py-1.5" @click="setAktif(t)">
                  <span class="material-symbols-outlined text-[18px]">check_circle</span>
                  Jadikan Aktif
                </button>
                <button v-if="!t.isActive" class="btn-danger-ghost !px-2 ml-2" @click="askDelete(t)" aria-label="Hapus">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else title="Belum ada tahun ajaran" message="Tambahkan tahun ajaran baru." icon="calendar_month" />

    <ModalDialog v-if="form.open" title="Tambah Tahun Ajaran" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nama Tahun Ajaran <span class="text-error">*</span></label>
          <input v-model="form.nama" class="input" placeholder="Contoh: 2026/2027" required />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="form.open = false">Batal</button>
          <button class="btn-primary" :disabled="saving">Simpan</button>
        </div>
      </form>
    </ModalDialog>

    <ConfirmDialog
      v-if="hapus"
      :message="`Hapus tahun ajaran ${hapus.nama}?`"
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
const form = ref({ open: false, nama: '' })

function openForm() {
  form.value = { open: true, nama: '' }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/tahun-ajaran')
    list.value = data.list
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await api.post('/admin/tahun-ajaran', { nama: form.value.nama })
    toast.success('Tahun ajaran ditambahkan.')
    form.value = { open: false, nama: '' }
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan tahun ajaran.')
  } finally {
    saving.value = false
  }
}

async function setAktif(t) {
  saving.value = true
  try {
    await api.patch(`/admin/tahun-ajaran/${t.id}/aktif`)
    toast.success(`${t.nama} dijadikan tahun ajaran aktif.`)
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah tahun ajaran aktif.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  saving.value = true
  try {
    await api.delete(`/admin/tahun-ajaran/${hapus.value.id}`)
    toast.success('Tahun ajaran dihapus.')
    hapus.value = null
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus tahun ajaran.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
