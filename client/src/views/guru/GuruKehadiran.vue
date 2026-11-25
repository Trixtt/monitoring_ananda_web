<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Rekap Kehadiran</h1>
      <p class="page-subtitle">Input kehadiran harian seluruh siswa dalam satu kelas</p>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
        Izin dan sakit dihitung sebagai kehadiran efektif; hanya alpa yang mengurangi skor.
        Pilih status untuk setiap siswa sebelum menyimpan — tidak ada status otomatis.
      </p>
    </div>

    <div class="card p-5">
      <div class="flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <label class="label">Tanggal</label>
          <input v-model="tanggal" type="date" class="input md:w-56" @change="load" />
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" @click="setHariIni">
            <span class="material-symbols-outlined text-[18px]">today</span>
            Hari Ini
          </button>
          <button class="btn-primary" :disabled="saving || !rows.length" @click="simpan">
            <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]" v-else>save</span>
            Simpan Kehadiran
          </button>
        </div>
      </div>
      <div v-if="summary" class="flex flex-wrap gap-3 mt-4 pt-4 border-t border-surface-variant dark:border-white/10">
        <span v-for="(r, key) in summary" :key="key" class="badge bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-ice-white/60 capitalize">
          {{ key }}: {{ r }}
        </span>
      </div>
    </div>

    <div v-if="loading && !rows.length"><LoadingState /></div>

    <div v-else-if="rows.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Absen</th>
              <th>Nama</th>
              <th colspan="4">Status Kehadiran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.siswa.id">
              <td>{{ row.siswa.nomorAbsen }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ row.siswa.nama }}</td>
              <td class="whitespace-nowrap">
                <label v-for="st in statusList" :key="st.value" class="inline-flex items-center gap-1.5 mr-3 font-label-sm cursor-pointer" :class="row.status === st.value ? st.text : 'text-on-surface-variant dark:text-ice-white/60'">
                  <input type="radio" :name="'hadir-' + row.siswa.id" :value="st.value" v-model="row.status" class="accent-dark-teal" />
                  {{ st.label }}
                </label>
                <span v-if="!row.status" class="badge bg-status-perhatian/20 text-yellow-700 dark:text-yellow-300 ml-2">Belum diisi</span>
              </td>
              <td>
                <input v-model="row.keterangan" class="input !py-1.5 md:w-48" placeholder="opsional" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else title="Belum ada siswa" message="Pilih tanggal untuk melihat daftar siswa pada kelas ini." icon="how_to_reg" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { useToastStore } from '../../stores/toast'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { params } = useGuruKelas()
const toast = useToastStore()

const statusList = [
  { value: 'hadir', label: 'Hadir', text: 'text-status-aman' },
  { value: 'izin', label: 'Izin', text: 'text-yellow-700' },
  { value: 'sakit', label: 'Sakit', text: 'text-dark-teal' },
  { value: 'alpa', label: 'Alpa', text: 'text-status-berisiko' }
]

const tanggal = ref(new Date().toISOString().slice(0, 10))
const rows = ref([])
const loading = ref(true)
const saving = ref(false)

const summary = computed(() => {
  const r = { hadir: 0, izin: 0, sakit: 0, alpa: 0, 'belum diisi': 0 }
  rows.value.forEach((row) => {
    if (!row.status) r['belum diisi']++
    else if (r[row.status] !== undefined) r[row.status]++
  })
  return r
})

const belumDiisi = computed(() => rows.value.filter((r) => !r.status).length)

function setHariIni() {
  tanggal.value = new Date().toISOString().slice(0, 10)
  load()
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/guru/kehadiran', { params: { tanggal: tanggal.value, ...params() } })
    rows.value = data.list.map(({ siswa, kehadiran }) => ({
      siswa,
      status: kehadiran?.status || '',
      keterangan: kehadiran?.keterangan || ''
    }))
  } finally {
    loading.value = false
  }
}

async function simpan() {
  if (belumDiisi.value) {
    toast.error(`Masih ada ${belumDiisi.value} siswa yang belum dipilih statusnya.`)
    return
  }
  saving.value = true
  try {
    await api.post('/guru/kehadiran', {
      tanggal: tanggal.value,
      daftar: rows.value
        .filter((r) => r.status)
        .map((r) => ({ siswaId: r.siswa.id, status: r.status, keterangan: r.keterangan }))
    })
    toast.success('Kehadiran berhasil disimpan.')
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan kehadiran.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
