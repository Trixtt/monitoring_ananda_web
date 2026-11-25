<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Catatan Kejadian Sikap</h1>
      <p class="page-subtitle">Catat kejadian sikap spiritual atau sosial yang benar-benar diamati (1 = Kurang, 5 = Sangat Baik)</p>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
        Baris kosong berarti <strong>belum ada kejadian yang dicatat</strong> dan tidak akan disimpan. Siswa tanpa catatan
        kejadian pada periode ini ditandai <strong>Data Belum Lengkap</strong>, bukan otomatis sangat baik.
      </p>
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
        <label class="label">Tanggal Kejadian</label>
        <input v-model="tanggal" type="date" class="input md:w-56" />
      </div>
      <button class="btn-primary" :disabled="saving || !tercatat" @click="simpan">
        <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span class="material-symbols-outlined text-[18px]" v-else>save</span>
        Simpan Kejadian
      </button>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 md:ml-auto">
        {{ tercatat }} kejadian akan dicatat
      </p>
    </div>

    <div v-if="loading && !rows.length"><LoadingState /></div>

    <div v-else-if="rows.length" class="card overflow-hidden">
      <div class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>Absen</th>
              <th>Nama</th>
              <th>Nilai Kejadian (1-5)</th>
              <th>Status</th>
              <th>Catatan Kejadian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.siswa.id">
              <td>{{ row.siswa.nomorAbsen }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ row.siswa.nama }}</td>
              <td>
                <div class="flex gap-1">
                  <button
                    v-for="n in 5"
                    :key="n"
                    type="button"
                    class="w-9 h-9 rounded-lg border font-label-md transition-colors"
                    :class="Number(row.nilai) === n ? 'bg-dark-teal text-white border-dark-teal dark:border-light-teal' : 'border-outline-variant dark:border-white/15 text-on-surface-variant dark:text-ice-white/60 hover:bg-surface-container-low dark:hover:bg-white/10'"
                    @click="row.nilai = n"
                  >
                    {{ n }}
                  </button>
                  <button
                    v-if="row.nilai !== null"
                    type="button"
                    class="w-9 h-9 rounded-lg border border-outline-variant font-label-md text-on-surface-variant dark:border-white/15 dark:text-ice-white/60"
                    title="Kosongkan (tidak ada kejadian)"
                    @click="row.nilai = null"
                  >
                    ×
                  </button>
                </div>
              </td>
              <td class="text-on-surface-variant dark:text-ice-white/60">
                {{ row.nilai === null ? 'Belum ada catatan' : labelSikap[row.nilai] }}
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
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { useToastStore } from '../../stores/toast'
import { labelSikap } from '../../utils/format'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'

const { params } = useGuruKelas()
const toast = useToastStore()

const jenis = ref('spiritual')
const tanggal = ref(new Date().toISOString().slice(0, 10))
const rows = ref([])
const loading = ref(true)
const saving = ref(false)
const tercatat = computed(() => rows.value.filter((r) => r.nilai !== null).length)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/guru/siswa', { params: params() })
    // Event-based: tidak ada nilai default. Setiap kejadian harus dipilih guru.
    rows.value = data.list.map(({ siswa }) => ({ siswa, nilai: null, catatan: '' }))
  } finally {
    loading.value = false
  }
}

async function simpan() {
  const daftar = rows.value
    .filter((r) => Number(r.nilai) >= 1 && Number(r.nilai) <= 5)
    .map((r) => ({
      siswaId: r.siswa.id,
      jenis: jenis.value,
      nilai: Number(r.nilai),
      catatan: r.catatan,
      tanggal: tanggal.value
    }))
  if (!daftar.length) {
    toast.error('Belum ada kejadian yang dipilih untuk disimpan.')
    return
  }
  saving.value = true
  try {
    const { data } = await api.post('/guru/sikap', { daftar })
    toast.success(data?.message || 'Kejadian sikap berhasil disimpan.')
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan kejadian sikap.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
