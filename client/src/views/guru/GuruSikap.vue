<template>
  <div class="space-y-6">
    <div>
      <h1 class="page-title">Catatan Sikap</h1>
      <p class="page-subtitle">Catat kejadian yang perlu mendapat perhatian atau dokumentasi.</p>
      <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
        Catatan dibuat hanya saat ada kejadian. Tidak perlu mengisi setiap hari. Skor dihitung dari 100 dikurangi
        pengurangan catatan yang tersimpan pada semester ini. Tanpa catatan berarti tidak ada pengurangan, bukan
        penilaian menyeluruh.
      </p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <template v-else>
      <form class="card p-5 space-y-4" @submit.prevent="simpan">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label" for="sikap-siswa">Siswa</label>
            <select id="sikap-siswa" v-model="siswaId" class="input" :disabled="saving">
              <option :value="null">Pilih siswa</option>
              <option v-for="row in rows" :key="row.siswa.id" :value="row.siswa.id">
                {{ row.siswa.nomorAbsen }}. {{ row.siswa.nama }}
              </option>
            </select>
          </div>
          <div>
            <label class="label" for="sikap-kategori">Jenis Kejadian</label>
            <select id="sikap-kategori" v-model="kategori" class="input" :disabled="saving" @change="sesuaikanAspek">
              <option value="">Pilih kejadian</option>
              <option v-for="item in daftarKategori" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="label" for="sikap-aspek">Aspek</label>
            <select id="sikap-aspek" v-model="aspek" class="input" :disabled="saving">
              <option value="" disabled>Pilih aspek</option>
              <option value="sosial">Sosial</option>
              <option value="spiritual">Spiritual</option>
            </select>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mt-1">
              Kejadian baku dari sekolah menggunakan aspek Sosial. Untuk "Lainnya", aspek wajib dipilih.
            </p>
          </div>
          <div>
            <label class="label" for="sikap-tanggal">Tanggal Kejadian</label>
            <input id="sikap-tanggal" v-model="tanggal" type="date" class="input" :disabled="saving" />
            <p v-if="kategori === 'Bolos'" class="font-label-sm text-status-perhatian mt-1">
              Presensi tanggal ini harus sudah berstatus Alpa sebelum catatan Bolos disimpan.
            </p>
          </div>
        </div>
        <div>
          <label class="label" for="sikap-keterangan">Keterangan Kejadian</label>
          <textarea
            id="sikap-keterangan"
            v-model="keterangan"
            class="input min-h-24"
            maxlength="1000"
            :disabled="saving"
            :placeholder="kategori === 'Lainnya' ? 'Wajib diisi. Jelaskan kejadian yang terjadi.' : 'Tambahkan keterangan bila perlu.'"
          ></textarea>
          <p v-if="kategori === 'Lainnya'" class="font-label-sm text-status-perhatian mt-1">
            Keterangan wajib diisi untuk kategori Lainnya.
          </p>
        </div>
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">
            {{ rows.length }} siswa terdaftar di kelas ini.
          </p>
          <button class="btn-primary" type="submit" :disabled="saving || !bisaDisimpan">
            <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else class="material-symbols-outlined text-[18px]">save</span>
            Simpan Catatan
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useGuruKelas } from '../../composables/useGuruKelas'
import { useToastStore } from '../../stores/toast'
import LoadingState from '../../components/LoadingState.vue'

const { params } = useGuruKelas()
const toast = useToastStore()

const daftarKategori = [
  'Bolos',
  'Tidak mengerjakan tugas',
  'Berkelahi dengan teman',
  'Memalak uang teman',
  'Membully teman/perundungan',
  'Berbicara kotor kepada teman',
  'Tidak sopan kepada guru',
  'Lainnya'
]

const siswaId = ref(null)
const kategori = ref('')
const aspek = ref('')
const tanggal = ref(new Date().toISOString().slice(0, 10))
const keterangan = ref('')
const rows = ref([])
const loading = ref(true)
const saving = ref(false)

const bisaDisimpan = computed(() => {
  if (!siswaId.value || !kategori.value || !tanggal.value || !aspek.value) return false
  if (kategori.value === 'Lainnya' && !keterangan.value.trim()) return false
  return true
})

function sesuaikanAspek() {
  if (kategori.value && kategori.value !== 'Lainnya') aspek.value = 'sosial'
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/guru/siswa', { params: params() })
    rows.value = data.list || []
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memuat daftar siswa.')
  } finally {
    loading.value = false
  }
}

async function simpan() {
  if (!bisaDisimpan.value) {
    toast.error('Lengkapi siswa, jenis kejadian, aspek, dan tanggal terlebih dahulu.')
    return
  }
  saving.value = true
  try {
    const { data } = await api.post('/guru/sikap', {
      daftar: [{
        siswaId: siswaId.value,
        kategori: kategori.value,
        jenis: aspek.value,
        catatan: keterangan.value,
        tanggal: tanggal.value
      }]
    })
    toast.success(data?.message || 'Catatan sikap berhasil disimpan.')
    keterangan.value = ''
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menyimpan catatan sikap.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
