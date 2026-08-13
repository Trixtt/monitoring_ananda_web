<template>
  <div class="space-y-6">
    <div>
      <router-link to="/guru/siswa" class="inline-flex items-center gap-1 font-label-md text-dark-teal hover:underline mb-3">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </router-link>
      <div v-if="siswa" class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ siswa.nama }}</h1>
          <p class="page-subtitle">
            Kelas {{ siswa.kelas?.nama }} &middot; NISN {{ siswa.nisn }} &middot; Absen {{ siswa.nomorAbsen }}
          </p>
        </div>
        <div class="flex gap-2">
          <StatusBadge v-if="skor" :kode="skor.kategori.kode" />
          <button class="btn-secondary" @click="openAbk = true">
            <span class="material-symbols-outlined text-[18px]">accessibility_new</span>
            {{ siswa.statusABK ? 'Ubah Status ABK' : 'Tandai ABK' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else-if="siswa">
      <!-- Skor -->
      <div v-if="skor" class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Hasil Skoring SPK</h2>
        <div v-if="skor.abk" class="rounded-lg bg-status-abk/10 border border-status-abk/30 p-4 font-body-md text-status-abk">
          Siswa dikecualikan dari skoring otomatis (status ABK). Gunakan pendekatan khusus sesuai catatan.
        </div>
        <template v-else>
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">Skor Akhir</p>
              <p class="font-headline-lg text-deep-navy dark:text-ice-white">{{ formatSkor(skor.skor) }}</p>
            </div>
            <StatusBadge :kode="skor.kategori.kode" />
          </div>
          <div class="space-y-4">
            <div v-for="b in breakdown" :key="b.label">
              <div class="flex justify-between font-label-md mb-1">
                <span class="text-on-surface-variant dark:text-ice-white/60">{{ b.label }}</span>
                <span class="text-deep-navy dark:text-ice-white">{{ persen(b.value) }}</span>
              </div>
              <div class="h-2.5 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden">
                <div class="h-full rounded-full bg-dark-teal transition-all" :style="{ width: persen(b.value) }"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Rekomendasi -->
      <div v-if="rekomendasi" class="card p-6 border-l-4" :class="borderRekomendasi">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-2">Rekomendasi Tindak Lanjut</h2>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-3">{{ rekomendasi.pesan }}</p>
        <ul class="space-y-2">
          <li v-for="r in rekomendasi.daftar" :key="r" class="flex items-start gap-2 font-body-md text-on-surface text-sm">
            <span class="material-symbols-outlined text-[18px] text-dark-teal mt-0.5">arrow_forward_ios</span>
            {{ r }}
          </li>
        </ul>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Nilai -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
            <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Riwayat Nilai</h2>
          </div>
          <div class="table-shell">
            <table class="table-base">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Judul</th>
                  <th>Mapel</th>
                  <th>Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in nilai" :key="n.id">
                  <td>{{ formatTanggal(n.tanggal) }}</td>
                  <td class="font-label-md text-deep-navy dark:text-ice-white">{{ n.judul }}</td>
                  <td>{{ n.mapel?.nama }}</td>
                  <td class="font-label-md">{{ n.nilai }}</td>
                </tr>
                <tr v-if="!nilai.length">
                  <td colspan="4" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada nilai</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Kehadiran -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
            <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Rekap Kehadiran</h2>
          </div>
          <div class="p-5 grid grid-cols-4 gap-3">
            <div v-for="(r, key) in ringkasKehadiran" :key="key" class="text-center rounded-lg bg-surface-container-low dark:bg-white/5 p-3">
              <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ r }}</p>
              <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 capitalize">{{ key }}</p>
            </div>
          </div>
          <div class="px-5 pb-5 space-y-2">
            <div v-for="k in kehadiran.slice(0, 10)" :key="k.id" class="flex items-center justify-between text-sm">
              <span class="font-body-md text-on-surface-variant dark:text-ice-white/60">{{ formatTanggal(k.tanggal) }}</span>
              <span class="badge" :class="kehadiranMap[k.status]?.cls">{{ kehadiranMap[k.status]?.label }}</span>
            </div>
            <p v-if="!kehadiran.length" class="text-center text-on-surface-variant dark:text-ice-white/60 py-6">Belum ada catatan kehadiran</p>
          </div>
        </div>
      </div>

      <!-- Sikap -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-variant dark:border-white/10">
          <h2 class="font-title-lg text-deep-navy dark:text-ice-white">Penilaian Sikap</h2>
        </div>
        <div class="table-shell">
          <table class="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Nilai</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sikap" :key="s.id">
                <td>{{ formatTanggal(s.tanggal) }}</td>
                <td class="capitalize">{{ s.jenis }}</td>
                <td><span class="badge bg-ice-white dark:bg-white/10 text-dark-teal dark:text-light-teal">{{ labelSikap[s.nilai] }}</span></td>
                <td class="text-on-surface-variant dark:text-ice-white/60">{{ s.catatan || '-' }}</td>
              </tr>
              <tr v-if="!sikap.length">
                <td colspan="4" class="text-center text-on-surface-variant dark:text-ice-white/60 py-8">Belum ada penilaian sikap</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal ABK -->
    <ModalDialog v-if="openAbk" :title="siswa?.statusABK ? 'Perbarui Status ABK' : 'Tandai sebagai ABK'" @close="openAbk = false">
      <form @submit.prevent="saveAbk" class="space-y-4">
        <div>
          <label class="label">Status</label>
          <select v-model="abkForm.statusABK" class="input">
            <option :value="true">ABK (dikecualikan dari skoring otomatis)</option>
            <option :value="false">Bukan ABK</option>
          </select>
        </div>
        <div>
          <label class="label">Catatan ABK</label>
          <textarea v-model="abkForm.catatanABK" class="input" rows="3" placeholder="Jenis kebutuhan khusus, pendampingan yang dibutuhkan, dst."></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="openAbk = false">Batal</button>
          <button class="btn-primary" :disabled="saving">
            <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Simpan
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { formatSkor, persen, formatTanggal, kehadiranMap, labelSikap } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import LoadingState from '../../components/LoadingState.vue'

const route = useRoute()
const toast = useToastStore()

const siswa = ref(null)
const skor = ref(null)
const rekomendasi = ref(null)
const nilai = ref([])
const kehadiran = ref([])
const sikap = ref([])
const loading = ref(true)
const openAbk = ref(false)
const saving = ref(false)
const abkForm = ref({ statusABK: false, catatanABK: '' })

const ringkasKehadiran = computed(() => {
  const r = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
  kehadiran.value.forEach((k) => {
    if (r[k.status] !== undefined) r[k.status]++
  })
  return r
})

const breakdown = computed(() => {
  if (!skor.value || skor.value.abk) return []
  return [
    { label: 'Nilai Akademik', value: skor.value.skorAkademik },
    { label: 'Kehadiran', value: skor.value.skorKehadiran },
    { label: 'Sikap', value: skor.value.skorSikap }
  ]
})

const borderRekomendasi = computed(() => {
  const map = {
    abk: 'border-status-abk',
    akademik: 'border-status-perhatian',
    kehadiran: 'border-status-berisiko',
    sikap: 'border-status-perhatian',
    baik: 'border-status-aman'
  }
  return map[rekomendasi.value?.tipe] || 'border-dark-teal'
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/guru/siswa/${route.params.id}`)
    siswa.value = data.siswa
    skor.value = data.skor
    rekomendasi.value = data.rekomendasi
    nilai.value = data.nilai
    kehadiran.value = data.kehadiran
    sikap.value = data.sikap
    abkForm.value = { statusABK: !!data.siswa.statusABK, catatanABK: data.siswa.catatanABK || '' }
  } finally {
    loading.value = false
  }
}

async function saveAbk() {
  saving.value = true
  try {
    await api.patch(`/guru/siswa/${route.params.id}/abk`, abkForm.value)
    toast.success('Status ABK diperbarui.')
    openAbk.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan status ABK.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
