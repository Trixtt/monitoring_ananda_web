<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="page-title">Konfigurasi SPK</h1>
      <p class="page-subtitle">Atur bobot kriteria dan interval klasifikasi metode SAW</p>
    </div>

    <div v-if="loading"><LoadingState /></div>

    <form v-else @submit.prevent="save" class="space-y-6">
      <div class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Bobot Kriteria</h2>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 text-sm mb-4">Jumlah bobot harus sama dengan 1 (100%).</p>
        <div class="space-y-4">
          <div v-for="b in bobotFields" :key="b.key">
            <div class="flex justify-between font-label-md mb-1">
              <span class="text-on-surface-variant dark:text-ice-white/60">{{ b.label }}</span>
              <span class="text-deep-navy dark:text-ice-white">{{ b.value }}%</span>
            </div>
            <input v-model.number="b.value" type="range" min="0" max="100" step="1" class="w-full accent-dark-teal" @input="sync" />
          </div>
          <div class="flex items-center justify-between rounded-lg px-4 py-3 font-label-md" :class="total === 100 ? 'bg-status-aman/10 text-status-aman' : 'bg-status-berisiko/10 text-status-berisiko'">
            <span>Total Bobot</span>
            <span>{{ total }}%</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Interval Klasifikasi</h2>
        <div class="space-y-4">
          <div>
            <label class="label">Batas Bawah "Baik / Aman"</label>
            <input v-model.number="form.intervalBaikBawah" type="number" min="0" max="1" step="0.01" class="input" />
          </div>
          <div>
            <label class="label">Batas Bawah "Perlu Perhatian"</label>
            <input v-model.number="form.intervalPerhatianBawah" type="number" min="0" max="1" step="0.01" class="input" />
          </div>
          <div>
            <label class="label">Batas Bawah "Berisiko"</label>
            <input v-model.number="form.intervalBerisikoBawah" type="number" min="0" max="1" step="0.01" class="input" />
          </div>
        </div>
      </div>

      <p v-if="error" class="rounded-md bg-error-container text-on-error-container px-3 py-2 font-label-md">{{ error }}</p>

      <div class="flex items-center gap-3">
        <button class="btn-primary" :disabled="saving">
          <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span class="material-symbols-outlined text-[18px]" v-else>save</span>
          Simpan Pengaturan
        </button>
        <button type="button" class="btn-secondary" @click="load">
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Reset Form
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../stores/toast'
import LoadingState from '../../components/LoadingState.vue'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = ref({
  bobotAkademik: 31,
  bobotKehadiran: 31,
  bobotSikap: 38,
  intervalBaikBawah: 0.67,
  intervalPerhatianBawah: 0.34,
  intervalBerisikoBawah: 0
})

const bobotFields = computed(() => [
  { key: 'bobotAkademik', label: 'Nilai Akademik', value: form.value.bobotAkademik },
  { key: 'bobotKehadiran', label: 'Kehadiran', value: form.value.bobotKehadiran },
  { key: 'bobotSikap', label: 'Sikap', value: form.value.bobotSikap }
])

const total = computed(() => bobotFields.value.reduce((a, b) => a + b.value, 0))

function sync() {}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/spk')
    const s = data.setting
    form.value = {
      bobotAkademik: Math.round(Number(s.bobotAkademik) * 100),
      bobotKehadiran: Math.round(Number(s.bobotKehadiran) * 100),
      bobotSikap: Math.round(Number(s.bobotSikap) * 100),
      intervalBaikBawah: Number(s.intervalBaikBawah),
      intervalPerhatianBawah: Number(s.intervalPerhatianBawah),
      intervalBerisikoBawah: Number(s.intervalBerisikoBawah)
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  error.value = ''
  if (total.value !== 100) {
    error.value = `Total bobot harus 100%. Saat ini ${total.value}%.`
    return
  }
  saving.value = true
  try {
    await api.put('/admin/spk', {
      bobotAkademik: form.value.bobotAkademik / 100,
      bobotKehadiran: form.value.bobotKehadiran / 100,
      bobotSikap: form.value.bobotSikap / 100,
      intervalBaikBawah: form.value.intervalBaikBawah,
      intervalPerhatianBawah: form.value.intervalPerhatianBawah,
      intervalBerisikoBawah: form.value.intervalBerisikoBawah
    })
    toast.success('Pengaturan SPK disimpan.')
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal menyimpan pengaturan.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
