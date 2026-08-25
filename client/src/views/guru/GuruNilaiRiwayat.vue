<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Riwayat Nilai</h1>
      <p class="page-subtitle">Lihat nilai yang sudah diinput per mata pelajaran dan per jenis penilaian</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Daftar mapel -->
      <aside class="card overflow-hidden h-fit lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Mata Pelajaran</h2>
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">Pilih mapel untuk melihat riwayat</p>
        </div>
        <div class="p-3 space-y-1 max-h-[420px] lg:max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
          <button
            v-for="m in mapels"
            :key="m.id"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-md transition-all active:scale-[0.98]"
            :class="selectedMapel === m.id
              ? 'bg-gradient-to-r from-dark-teal to-light-teal text-white shadow-card'
              : 'text-on-surface-variant dark:text-ice-white/70 hover:bg-surface-container-low dark:hover:bg-white/10'"
            @click="pilihMapel(m.id)"
          >
            <span class="material-symbols-outlined text-[20px]">menu_book</span>
            <span class="truncate">{{ m.nama }}</span>
            <span
              v-if="selectedMapel === m.id"
              class="ml-auto font-label-sm"
              :class="selectedMapel === m.id ? 'text-white/80' : 'text-outline dark:text-ice-white/40'"
            >
              {{ groups.length }}
            </span>
          </button>
          <div v-if="!mapels.length" class="px-3 py-6 text-center font-body-md text-on-surface-variant dark:text-ice-white/60">
            Memuat mapel...
          </div>
        </div>
      </aside>

      <!-- Nilai per penilaian -->
      <div class="lg:col-span-2 space-y-6 min-w-0">
        <div v-if="!selectedMapel" class="card">
          <EmptyState
            title="Pilih mata pelajaran"
            message="Pilih salah satu mapel di sebelah kiri untuk melihat riwayat nilai."
            icon="menu_book"
          />
        </div>

        <div v-else-if="loading" class="card p-5 space-y-3">
          <div class="skeleton h-6 w-40"></div>
          <div v-for="i in 4" :key="i" class="skeleton h-10 w-full rounded-lg"></div>
        </div>

        <div v-else-if="!groups.length" class="card">
          <EmptyState
            title="Belum ada nilai"
            message="Belum ada nilai tersimpan untuk mapel ini pada tahun ajaran berjalan."
            icon="history"
          />
        </div>

        <template v-else>
          <div class="card px-5 py-4 animate-fade-up">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="font-title-lg text-deep-navy dark:text-ice-white">{{ mapelNama }}</h2>
              <span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ groups.length }} penilaian</span>
            </div>
          </div>

          <div class="card px-5 py-4 animate-fade-up" style="animation-delay: 80ms">
            <label class="block font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-2" for="pilih-penilaian">
              Jenis Penilaian
            </label>
            <select v-model="selectedGroupIndex" id="pilih-penilaian" class="input">
              <option v-for="(g, gi) in groups" :key="gi" :value="gi">
                {{ g.judul }} — {{ formatTanggal(g.tanggal) }}
              </option>
            </select>
          </div>

          <transition name="swap" mode="out-in">
            <div v-if="activeGroup" :key="selectedGroupIndex" class="card overflow-hidden">
              <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="font-title-lg text-deep-navy dark:text-ice-white">{{ activeGroup.judul }}</h3>
                  <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ formatTanggal(activeGroup.tanggal) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge bg-status-aman/15 text-status-aman">{{ activeGroup.rows.filter((r) => r.nilai !== null).length }}/{{ activeGroup.rows.length }} dinilai</span>
                  <button class="btn-secondary !px-3" :disabled="!activeGroup.rows.length" @click="exportNilai">
                    <span class="material-symbols-outlined text-[18px]">download</span>
                    Ekspor CSV
                  </button>
                </div>
              </div>
              <div class="table-shell table-scroll lg:max-h-[440px]">
                <table class="table-base">
                  <thead>
                    <tr>
                      <th>Absen</th>
                      <th>Nama</th>
                      <th class="w-32">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in activeGroup.rows" :key="row.siswa.id">
                      <td>{{ row.siswa.nomorAbsen }}</td>
                      <td class="font-label-md text-deep-navy dark:text-ice-white">{{ row.siswa.nama }}</td>
                      <td>
                        <span v-if="row.nilai !== null" class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ formatNilai(row.nilai) }}</span>
                        <span v-else class="font-label-sm text-outline dark:text-ice-white/40">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </transition>
        </template>
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
import { exportCsv } from '../../utils/exportCsv'
import EmptyState from '../../components/EmptyState.vue'

const { kelasId } = useGuruKelas()
const toast = useToastStore()

const mapels = ref([])
const selectedMapel = ref(null)
const selectedGroupIndex = ref(0)
const loading = ref(false)
const data = ref([])

const mapelNama = computed(() => mapels.value.find((m) => m.id === selectedMapel.value)?.nama || '')

const activeGroup = computed(() => groups.value[selectedGroupIndex.value] || null)

const groups = computed(() => {
  const map = new Map()
  for (const { siswa, nilai } of data.value) {
    for (const n of nilai) {
      const key = `${n.judul}__${n.tanggal}`
      if (!map.has(key)) {
        map.set(key, { judul: n.judul, tanggal: n.tanggal, values: new Map() })
      }
      map.get(key).values.set(siswa.id, n.nilai)
    }
  }
  return [...map.values()]
    .map((g) => ({
      judul: g.judul,
      tanggal: g.tanggal,
      rows: data.value.map(({ siswa }) => ({
        siswa,
        nilai: g.values.has(siswa.id) ? g.values.get(siswa.id) : null
      }))
    }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
})

function formatNilai(n) {
  const num = Number(n)
  return Number.isInteger(num) ? String(num) : String(num)
}

function exportNilai() {
  const rows = activeGroup.value.rows.map((r) => [r.siswa.nomorAbsen, r.siswa.nama, r.nilai === null ? '' : formatNilai(r.nilai)])
  exportCsv(`nilai-${mapelNama.value}-${activeGroup.value.judul}.csv`.replace(/[^\w\-]+/g, '-'), ['Absen', 'Nama', 'Nilai'], rows)
}

async function pilihMapel(id) {
  selectedMapel.value = id
  selectedGroupIndex.value = 0
  loading.value = true
  try {
    const { data: res } = await api.get('/guru/nilai/mapel', {
      params: { mapelId: id, kelasId: kelasId.value || undefined }
    })
    data.value = res.list
  } catch (e) {
    data.value = []
    toast.error(e.response?.data?.message || 'Gagal memuat riwayat nilai.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data: res } = await api.get('/guru/mapel')
    mapels.value = res.list
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memuat daftar mapel.')
  }
})
</script>

<style scoped>
.swap-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.swap-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.table-scroll thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #ecf5f7;
}
.dark .table-scroll thead th {
  background-color: #0d2357;
}
</style>
