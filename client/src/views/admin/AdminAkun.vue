<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="page-title">Manajemen Akun</h1>
        <p class="page-subtitle">{{ total }} akun pengguna</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary" :disabled="!list.length" @click="exportData">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Ekspor CSV
        </button>
        <button class="btn-primary" @click="openForm()">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Buat Akun
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3">
      <input v-model="q" class="input md:w-64" placeholder="Cari nama / username / nama anak..." @keyup.enter="applyFilter" />
      <select v-model="fRole" class="input md:w-52" @change="applyFilter">
        <option value="">Semua Role</option>
        <option value="admin">Admin</option>
        <option value="wali_kelas">Wali Kelas</option>
        <option value="kepala_sekolah">Kepala Sekolah</option>
        <option value="orang_tua">Orang Tua</option>
      </select>
    </div>

    <div v-if="loading"><LoadingState skeleton variant="table" /></div>

    <div v-else-if="list.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>No. HP</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in list" :key="u.id">
              <td class="font-label-md text-deep-navy dark:text-ice-white">
                {{ u.name }}
                <p v-if="u.siswa || u.kelas" class="font-label-sm text-outline dark:text-ice-white/40 font-normal">{{ u.siswa || u.kelas }}</p>
              </td>
              <td>{{ u.username }}</td>
              <td>
                <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ u.roleLabel }}</span>
              </td>
              <td>{{ u.phone || '-' }}</td>
              <td>
                <button class="badge" :class="u.active ? 'bg-status-aman/15 text-status-aman' : 'bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-ice-white/60'" @click="toggleAktif(u)">
                  {{ u.active ? 'Aktif' : 'Nonaktif' }}
                </button>
              </td>
              <td class="text-right whitespace-nowrap">
                <button class="btn-ghost !px-2" title="Reset password" @click="resetPwd(u)">
                  <span class="material-symbols-outlined text-[20px]">key</span>
                </button>
                <button class="btn-ghost !px-2" title="Edit" @click="openForm(u)">
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar :total="total" :page="page" :per-page="perPage" @change="goPage" />
    </div>

    <EmptyState v-else title="Tidak ada akun" message="Tidak ada akun yang cocok dengan pencarian." icon="manage_accounts" />

    <ModalDialog v-if="form.open" :title="form.id ? 'Edit Akun' : 'Buat Akun'" @close="form.open = false">
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nama Lengkap <span class="text-error">*</span></label>
            <input v-model="form.name" class="input" required />
          </div>
          <div>
            <label class="label">Role <span class="text-error">*</span></label>
            <select v-model="form.role" class="input" :disabled="!!form.id" required>
              <option value="admin">Admin</option>
              <option value="wali_kelas">Wali Kelas</option>
              <option value="kepala_sekolah">Kepala Sekolah</option>
              <option value="orang_tua">Orang Tua</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Username <span class="text-error">*</span></label>
            <input v-model="form.username" class="input" :disabled="!!form.id" required />
          </div>
          <div>
            <label class="label">{{ form.id ? '' : 'Password Awal' }} <span class="text-error">{{ form.id ? '' : '*' }}</span></label>
            <input v-if="!form.id" v-model="form.password" class="input" placeholder="kosongkan = default" />
            <p v-else class="font-label-sm text-outline dark:text-ice-white/40 pt-2">Gunakan tombol reset password</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">No. WhatsApp</label>
            <input v-model="form.phone" class="input" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
        </div>

        <div v-if="form.role === 'wali_kelas'">
          <label class="label">Kelas yang Diampu</label>
          <select v-model="form.kelasId" class="input">
            <option :value="null">Pilih kelas</option>
            <option v-for="k in kelasList" :key="k.id" :value="k.id">{{ k.nama }} — {{ k.waliKelas || 'tanpa wali' }}</option>
          </select>
        </div>

        <div v-if="form.role === 'orang_tua'">
          <label class="label">Anak / Siswa</label>
          <select v-model="form.siswaId" class="input" @change="autofill">
            <option :value="null">Pilih siswa</option>
            <option v-for="s in siswaList" :key="s.id" :value="s.id">{{ s.nama }} — {{ s.kelas?.nama }}</option>
          </select>
          <div v-if="form.siswaId" class="mt-3 rounded-lg bg-ice-white dark:bg-white/5 border border-light-teal/50 dark:border-white/10 p-3 space-y-1 font-label-sm text-on-surface-variant dark:text-ice-white/70">
            <p><span class="text-dark-teal dark:text-light-teal font-label-md">Username:</span> {{ form.username }}</p>
            <p><span class="text-dark-teal dark:text-light-teal font-label-md">Password awal:</span> {{ form.password || 'tanggal lahir (DDMMYYYY)' }} (wajib diganti saat login)</p>
          </div>
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
      v-if="resetTarget"
      title="Reset Password"
      :message="`Reset password ${resetTarget.username} ke password awal? Katakan kepada orang tua untuk menghubungi Anda bila perlu bantuan.`"
      confirm-label="Reset"
      :loading="saving"
      @confirm="doResetPwd"
      @cancel="resetTarget = null"
    />

    <ModalDialog v-if="resetResult" title="Password Direset" @close="resetResult = null">
      <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-4">
        Password awal akun <span class="font-label-md text-deep-navy dark:text-ice-white">{{ resetResult.username }}</span> telah direset. Sampaikan password ini kepada orang tua secara langsung / via WhatsApp.
      </p>
      <div class="flex items-center justify-between gap-3 rounded-lg bg-ice-white dark:bg-white/5 border border-light-teal/50 dark:border-white/10 p-4">
        <div>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-1">Password Baru</p>
          <p class="font-headline-md text-deep-navy dark:text-ice-white tracking-widest">{{ resetResult.passwordBaru }}</p>
        </div>
        <button class="btn-secondary" @click="salinPassword">
          <span class="material-symbols-outlined text-[18px]">content_copy</span>
          Salin
        </button>
      </div>
      <div class="flex justify-end gap-3 pt-5">
        <button class="btn-primary" @click="resetResult = null">Selesai</button>
      </div>
    </ModalDialog>
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
const siswaList = ref([])
const loading = ref(true)
const saving = ref(false)
const q = ref('')
const fRole = ref('')
const page = ref(1)
const perPage = ref(25)
const total = ref(0)

const kosong = { open: false, id: null, name: '', username: '', password: '', role: 'orang_tua', phone: '', email: '', kelasId: null, siswaId: null }
const form = ref({ ...kosong })
const resetTarget = ref(null)
const resetResult = ref(null)

function openForm(u) {
  form.value = u
    ? { ...kosong, open: true, id: u.id, name: u.name, username: u.username, password: '', role: u.role, phone: u.phone || '', email: u.email || '', kelasId: u.kelasId ?? null, siswaId: u.siswaId ?? null }
    : { ...kosong, open: true }
}

function autofill() {
  const siswa = siswaList.value.find((s) => s.id === Number(form.value.siswaId))
  if (!siswa) return
  form.value.username = `${siswa.tahunAngkatan}${String(siswa.nomorAbsen).padStart(3, '0')}`
  if (siswa.tanggalLahir) {
    const digits = siswa.tanggalLahir.replaceAll('-', '')
    form.value.password = digits.slice(6, 8) + digits.slice(4, 6) + digits.slice(0, 4)
  }
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: perPage.value }
    if (q.value) params.q = q.value
    if (fRole.value) params.role = fRole.value
    const { data } = await api.get('/admin/akun', { params })
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
    if (fRole.value) params.role = fRole.value
    const { data } = await api.get('/admin/akun', { params })
    const rows = data.list.map((u) => [
      u.name,
      u.username,
      u.roleLabel,
      u.phone || '',
      u.kelas || u.siswa || '',
      u.active ? 'Aktif' : 'Nonaktif'
    ])
    exportCsv('data-akun.csv', ['Nama', 'Username', 'Role', 'No. HP', 'Kelas / Anak', 'Status'], rows)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengekspor data akun.')
  }
}

async function save() {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/admin/akun/${form.value.id}`, {
        name: form.value.name,
        role: form.value.role,
        phone: form.value.phone,
        email: form.value.email,
        kelasId: form.value.kelasId,
        siswaId: form.value.siswaId
      })
      toast.success('Akun diperbarui.')
    } else {
      const { data } = await api.post('/admin/akun', form.value)
      if (form.value.role === 'orang_tua') {
        toast.success(`Akun dibuat. Password awal: ${data.passwordAwal}`)
      } else {
        toast.success('Akun dibuat.')
      }
    }
    form.value = { ...kosong }
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan akun.')
  } finally {
    saving.value = false
  }
}

async function toggleAktif(u) {
  try {
    await api.put(`/admin/akun/${u.id}`, { active: !u.active })
    toast.success(`Akun ${u.active ? 'dinonaktifkan' : 'diaktifkan'}.`)
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah status akun.')
  }
}

function resetPwd(u) {
  resetTarget.value = u
}

async function doResetPwd() {
  const u = resetTarget.value
  if (!u || saving.value) return
  saving.value = true
  try {
    const { data } = await api.post(`/admin/akun/${u.id}/reset-password`)
    resetTarget.value = null
    resetResult.value = { username: u.username, passwordBaru: data.passwordBaru }
    toast.success(`Password ${u.username} direset ke password awal.`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal reset password.')
  } finally {
    saving.value = false
  }
}

async function salinPassword() {
  try {
    await navigator.clipboard.writeText(resetResult.value?.passwordBaru || '')
    toast.success('Password baru disalin.')
  } catch {
    toast.error('Gagal menyalin password.')
  }
}

onMounted(async () => {
  const [k, s] = await Promise.all([
    api.get('/admin/kelas'),
    api.get('/admin/akun/opsi-siswa')
  ])
  kelasList.value = k.data.list
  siswaList.value = s.data.list
  load()
})
</script>
