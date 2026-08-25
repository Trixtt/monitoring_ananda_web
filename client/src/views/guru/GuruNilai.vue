<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Input Nilai</h1>
      <p class="page-subtitle">Masukkan nilai siswa dan kirim notifikasi ke orang tua</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Form -->
      <div class="card p-6 lg:col-span-1 h-fit">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Form Nilai</h2>
        <form @submit.prevent="siapkan" class="space-y-4">
          <div>
            <label class="label">Mata Pelajaran</label>
            <select v-model="form.mapelId" class="input" required>
              <option :value="null" disabled>Pilih mapel</option>
              <option v-for="m in mapels" :key="m.id" :value="m.id">{{ m.nama }}</option>
            </select>
          </div>
          <div>
            <label class="label">Judul / Jenis Penilaian</label>
            <input v-model="form.judul" class="input" placeholder="Contoh: Ulangan Harian 3" required />
          </div>
          <div>
            <label class="label">Tanggal</label>
            <input v-model="form.tanggal" type="date" class="input" required />
          </div>
          <div>
            <label class="label">Nilai Awal (untuk semua siswa)</label>
            <input
              v-model="form.defaultNilai"
              type="number"
              min="0"
              max="100"
              class="input"
              placeholder="opsional"
              @change="form.defaultNilai = clampNilai(form.defaultNilai)"
            />
            <p class="font-label-sm text-outline dark:text-ice-white/40 mt-1">Nilai 0-100. Kosongkan pada baris siswa yang belum dinilai.</p>
          </div>
          <div class="flex items-center gap-2">
            <input id="kirimWA" v-model="form.kirimWA" type="checkbox" class="accent-dark-teal" />
            <label for="kirimWA" class="font-label-md text-on-surface-variant dark:text-ice-white/60">Kirim WhatsApp ke orang tua</label>
          </div>
          <button class="btn-primary w-full">
            <span class="material-symbols-outlined text-[18px]">playlist_add_check</span>
            Siapkan Daftar Nilai
          </button>
        </form>
      </div>

      <!-- Daftar input -->
      <div class="lg:col-span-2 space-y-6">
        <div v-if="!rows.length && !loading" class="card">
          <EmptyState
            title="Belum menyiapkan form"
            message="Pilih mata pelajaran, judul, dan tanggal di samping lalu klik Siapkan Daftar Nilai."
            icon="edit_note"
          />
        </div>

        <div v-else class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex items-center justify-between">
            <div>
              <h2 class="font-title-lg text-deep-navy dark:text-ice-white">{{ form.judul }}</h2>
              <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ mapelNama }} &middot; {{ formatTanggal(form.tanggal) }}</p>
            </div>
            <button class="btn-secondary" :disabled="saving" @click="simpan">
              <span v-if="saving" class="w-4 h-4 border-2 border-dark-teal border-t-transparent rounded-full animate-spin"></span>
              <span class="material-symbols-outlined text-[18px]" v-else>save</span>
              Simpan Semua
            </button>
          </div>
          <div class="table-shell">
            <table class="table-base">
              <thead>
                <tr>
                  <th>Absen</th>
                  <th>Nama</th>
                  <th class="w-32">Nilai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in rows" :key="row.siswa.id">
                  <td>{{ row.siswa.nomorAbsen }}</td>
                  <td class="font-label-md text-deep-navy dark:text-ice-white">{{ row.siswa.nama }}</td>
                  <td>
                    <input
                      :ref="(el) => (inputRefs[index] = el)"
                      v-model="row.nilai"
                      type="number"
                      min="0"
                      max="100"
                      class="input !py-1.5 text-center"
                      :disabled="row.status === 'ok'"
                      @change="row.nilai = clampNilai(row.nilai)"
                      @keydown.enter.prevent="fokusBerikutnya(index)"
                    />
                  </td>
                  <td>
                    <span v-if="row.status === 'ok'" class="badge bg-status-aman/15 text-status-aman">Tersimpan</span>
                    <span v-else-if="row.nilai === '' || row.nilai === null" class="font-label-sm text-outline dark:text-ice-white/40">Dilewati</span>
                    <span v-else class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">Siap</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="progress.berhasil > 0" class="px-5 py-3 bg-status-aman/10 font-label-sm text-status-aman border-t border-surface-variant dark:border-white/10">
            {{ progress.berhasil }} nilai berhasil disimpan.
            <span v-if="progress.gagal">, {{ progress.gagal }} gagal.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { useToastStore } from '../../stores/toast'
import { formatTanggal } from '../../utils/format'
import EmptyState from '../../components/EmptyState.vue'

const { params } = useGuruKelas()
const toast = useToastStore()

const mapels = ref([])
const rows = ref([])
const saving = ref(false)
const loading = ref(false)
const progress = ref({ berhasil: 0, gagal: 0 })

const form = ref({
  mapelId: null,
  judul: '',
  tanggal: new Date().toISOString().slice(0, 10),
  defaultNilai: '',
  kirimWA: false
})

const mapelNama = computed(() => mapels.value.find((m) => m.id === Number(form.value.mapelId))?.nama || '')

function clampNilai(value) {
  if (value === '' || value === null || value === undefined) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return Math.min(100, Math.max(0, n))
}

const inputRefs = ref([])

function fokusBerikutnya(index) {
  const next = rows.value.findIndex((r, i) => i > index && r.status !== 'ok')
  if (next !== -1) inputRefs.value[next]?.focus()
}

async function siapkan() {
  if (!form.value.mapelId || !form.value.judul.trim() || !form.value.tanggal) {
    toast.error('Mapel, judul, dan tanggal wajib diisi.')
    return
  }
  loading.value = true
  progress.value = { berhasil: 0, gagal: 0 }
  inputRefs.value = []
  try {
    const { data } = await api.get('/guru/siswa', { params: params() })
    rows.value = data.list.map(({ siswa }) => ({
      siswa,
      nilai: form.value.defaultNilai !== '' ? clampNilai(form.value.defaultNilai) : '',
      status: ''
    }))
    if (!rows.value.length) toast.info('Belum ada siswa pada kelas ini.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memuat daftar siswa.')
  } finally {
    loading.value = false
  }
}

async function simpan() {
  const pending = rows.value.filter((r) => r.status !== 'ok' && r.nilai !== '' && r.nilai !== null)
  if (!pending.length) {
    toast.info('Tidak ada nilai baru untuk disimpan.')
    return
  }
  const invalid = pending.filter((r) => Number(r.nilai) < 0 || Number(r.nilai) > 100)
  if (invalid.length) {
    toast.error(`${invalid.length} nilai berada di luar rentang 0-100. Perbaiki terlebih dahulu.`)
    return
  }
  saving.value = true
  progress.value = { berhasil: 0, gagal: 0 }
  let berhasil = 0
  let gagal = 0
  for (const row of pending) {
    try {
      await api.post('/guru/nilai', {
        siswaId: row.siswa.id,
        mapelId: form.value.mapelId,
        judul: form.value.judul.trim(),
        nilai: Number(row.nilai),
        tanggal: form.value.tanggal
      })
      row.status = 'ok'
      berhasil++
    } catch {
      row.status = 'gagal'
      gagal++
    }
    progress.value = { berhasil, gagal }
  }
  saving.value = false
  toast.success(`${berhasil} nilai tersimpan. Notifikasi terkirim ke orang tua.`)
}

onMounted(async () => {
  const { data } = await api.get('/guru/mapel')
  mapels.value = data.list
})
</script>
