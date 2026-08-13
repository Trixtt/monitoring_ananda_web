<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Penilaian Sikap</h1>
      <p class="page-subtitle">Input sikap spiritual dan sosial per siswa (1=Kurang, 2=Cukup, 3=Baik, 4=Sangat Baik)</p>
    </div>

    <div class="card p-5 flex flex-col md:flex-row md:items-end gap-4">
      <div>
        <label class="label">Jenis Sikap</label>
        <select v-model="jenis" class="input md:w-56">
          <option value="spiritual">Spiritual</option>
          <option value="sosial">Sosial</option>
        </select>
      </div>
      <div>
        <label class="label">Tanggal</label>
        <input v-model="tanggal" type="date" class="input md:w-56" />
      </div>
      <button class="btn-primary" :disabled="saving || !rows.length" @click="simpan">
        <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span class="material-symbols-outlined text-[18px]" v-else>save</span>
        Simpan Penilaian
      </button>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <div v-else-if="rows.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Absen</th>
              <th>Nama</th>
              <th>Nilai Sikap</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.siswa.id">
              <td>{{ row.siswa.nomorAbsen }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ row.siswa.nama }}</td>
              <td>
                <div class="flex gap-1">
                  <button
                    v-for="n in 4"
                    :key="n"
                    class="w-9 h-9 rounded-lg border font-label-md transition-colors"
                    :class="Number(row.nilai) === n ? 'bg-dark-teal text-white border-dark-teal dark:border-light-teal' : 'border-outline-variant dark:border-white/15 text-on-surface-variant dark:text-ice-white/60 hover:bg-surface-container-low dark:hover:bg-white/10'"
                    @click="row.nilai = n"
                  >
                    {{ n }}
                  </button>
                </div>
              </td>
              <td>
                <input v-model="row.catatan" class="input !py-1.5 md:w-56" placeholder="opsional" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EmptyState v-else title="Belum ada siswa" message="Daftar siswa pada kelas ini masih kosong." icon="favorite" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { useToastStore } from '../../stores/toast'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { params } = useGuruKelas()
const toast = useToastStore()

const jenis = ref('spiritual')
const tanggal = ref(new Date().toISOString().slice(0, 10))
const rows = ref([])
const loading = ref(true)
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/guru/siswa', { params: params() })
    rows.value = data.list.map(({ siswa }) => ({ siswa, nilai: 3, catatan: '' }))
  } finally {
    loading.value = false
  }
}

async function simpan() {
  const daftar = rows.value.filter((r) => r.nilai)
  if (!daftar.length) return
  saving.value = true
  try {
    await api.post('/guru/sikap', {
      daftar: daftar.map((r) => ({
        siswaId: r.siswa.id,
        jenis: jenis.value,
        nilai: r.nilai,
        catatan: r.catatan,
        tanggal: tanggal.value
      }))
    })
    toast.success('Penilaian sikap berhasil disimpan.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan penilaian sikap.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
