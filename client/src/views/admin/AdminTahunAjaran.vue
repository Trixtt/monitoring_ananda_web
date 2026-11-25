<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Tahun Ajaran</h1>
        <p class="page-subtitle">Kelola tahun ajaran aktif, semester aktif, dan rentang tiap semester</p>
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
              <th>Semester Aktif</th>
              <th>Rentang Semester</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in list" :key="t.id">
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ t.nama }}</td>
              <td>
                <span class="badge bg-dark-teal/10 text-dark-teal">{{ t.semesterAktif || 'Ganjil' }}</span>
              </td>
              <td class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ rentangTeks(t) }}</td>
              <td>
                <span v-if="t.isActive" class="badge bg-status-aman/15 text-status-aman">Aktif</span>
                <span v-else class="badge bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-ice-white/60">Tidak aktif</span>
              </td>
              <td class="text-right whitespace-nowrap">
                <button class="btn-secondary !py-1.5" @click="openForm(t)">
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                  Atur Semester
                </button>
                <button v-if="!t.isActive" class="btn-secondary !py-1.5 ml-2" @click="setAktif(t)">
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

    <ModalDialog
      v-if="form.open"
      :title="form.id ? 'Atur Tahun Ajaran' : 'Tambah Tahun Ajaran'"
      @close="form.open = false"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Nama Tahun Ajaran <span class="text-error">*</span></label>
          <input v-model="form.nama" class="input" placeholder="Contoh: 2025/2026" required />
        </div>
        <div>
          <label class="label">Semester Aktif</label>
          <select v-model="form.semesterAktif" class="input">
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
            Perhitungan SAW dan laporan memakai semester ini secara default.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <p class="font-label-md text-deep-navy dark:text-ice-white">Semester Ganjil</p>
            <div>
              <label class="label">Mulai</label>
              <input v-model="form.ganjilMulai" type="date" class="input" />
            </div>
            <div>
              <label class="label">Akhir</label>
              <input v-model="form.ganjilAkhir" type="date" class="input" />
            </div>
          </div>
          <div class="space-y-3">
            <p class="font-label-md text-deep-navy dark:text-ice-white">Semester Genap</p>
            <div>
              <label class="label">Mulai</label>
              <input v-model="form.genapMulai" type="date" class="input" />
            </div>
            <div>
              <label class="label">Akhir</label>
              <input v-model="form.genapAkhir" type="date" class="input" />
            </div>
          </div>
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

// Bawaan Kaldik SD/MI Jawa Tengah 2025/2026.
const RENTANG_BAWAAAN = {
  Ganjil: { mulai: '2025-07-14', akhir: '2025-12-21' },
  Genap: { mulai: '2026-01-05', akhir: '2026-06-21' }
}

const toast = useToastStore()
const list = ref([])
const loading = ref(true)
const saving = ref(false)
const hapus = ref(null)

function formKosong() {
  return {
    open: false,
    id: null,
    nama: '',
    semesterAktif: 'Ganjil',
    ganjilMulai: RENTANG_BAWAAAN.Ganjil.mulai,
    ganjilAkhir: RENTANG_BAWAAAN.Ganjil.akhir,
    genapMulai: RENTANG_BAWAAAN.Genap.mulai,
    genapAkhir: RENTANG_BAWAAAN.Genap.akhir
  }
}

const form = ref(formKosong())

function openForm(t = null) {
  if (!t) {
    form.value = { ...formKosong(), open: true }
    return
  }
  form.value = {
    open: true,
    id: t.id,
    nama: t.nama,
    semesterAktif: t.semesterAktif || 'Ganjil',
    ganjilMulai: t.ganjilMulai || RENTANG_BAWAAAN.Ganjil.mulai,
    ganjilAkhir: t.ganjilAkhir || RENTANG_BAWAAAN.Ganjil.akhir,
    genapMulai: t.genapMulai || RENTANG_BAWAAAN.Genap.mulai,
    genapAkhir: t.genapAkhir || RENTANG_BAWAAAN.Genap.akhir
  }
}

function rentangTeks(t) {
  const semester = t.semesterAktif || 'Ganjil'
  const mulai = semester === 'Ganjil' ? t.ganjilMulai : t.genapMulai
  const akhir = semester === 'Ganjil' ? t.ganjilAkhir : t.genapAkhir
  return mulai && akhir ? `${mulai} s/d ${akhir}` : '—'
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
  for (const [mulai, akhir] of [['ganjilMulai', 'ganjilAkhir'], ['genapMulai', 'genapAkhir']]) {
    if (Boolean(form.value[mulai]) !== Boolean(form.value[akhir])) {
      toast.error('Tanggal mulai dan akhir setiap semester harus diisi berpasangan.')
      return
    }
  }

  saving.value = true
  try {
    const payload = {
      nama: form.value.nama,
      semesterAktif: form.value.semesterAktif,
      ganjilMulai: form.value.ganjilMulai || null,
      ganjilAkhir: form.value.ganjilAkhir || null,
      genapMulai: form.value.genapMulai || null,
      genapAkhir: form.value.genapAkhir || null
    }
    if (form.value.id) {
      await api.put(`/admin/tahun-ajaran/${form.value.id}`, payload)
      toast.success('Semester aktif dan rentang tahun ajaran diperbarui.')
    } else {
      await api.post('/admin/tahun-ajaran', payload)
      toast.success('Tahun ajaran ditambahkan.')
    }
    form.value = formKosong()
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
