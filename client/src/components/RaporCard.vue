<template>
  <div ref="printArea" class="card overflow-hidden print-area">
    <!-- Kop rapor -->
    <div class="px-6 py-5 bg-deep-navy dark:bg-[#051238] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3">
        <img src="/logo.svg" alt="SD Negeri 4 Keling" width="44" height="44" class="w-11 h-11 shrink-0" />
        <div>
          <p class="font-headline-md">SD Negeri 4 Keling</p>
          <p class="font-label-sm text-ice-white/70">Rapor Perkembangan Siswa</p>
        </div>
      </div>
      <div class="font-label-sm text-ice-white/70 text-left sm:text-right">
        <p>{{ rapor.tahunAjaran || 'Tahun Ajaran Aktif' }}</p>
        <p>{{ formatTanggal(rapor.tanggalRapor) }}</p>
      </div>
    </div>

    <!-- Identitas -->
    <div class="px-6 py-4 border-b border-surface-variant dark:border-white/10">
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 font-body-md text-sm">
        <p class="text-on-surface-variant dark:text-ice-white/60">Nama Lengkap</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ rapor.siswa.nama }}</p>
        <p class="text-on-surface-variant dark:text-ice-white/60">NISN</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ rapor.siswa.nisn }}</p>
        <p class="text-on-surface-variant dark:text-ice-white/60">Kelas</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ rapor.siswa.kelas?.nama || '-' }}</p>
        <p class="text-on-surface-variant dark:text-ice-white/60">Nomor Absen</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ rapor.siswa.nomorAbsen || '-' }}</p>
        <p class="text-on-surface-variant dark:text-ice-white/60">Wali Kelas</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white">{{ rapor.siswa.kelas?.waliKelas || '-' }}</p>
        <p class="text-on-surface-variant dark:text-ice-white/60">Kondisi</p>
        <p><StatusBadge :kode="rapor.skor.kategori.kode" /></p>
      </div>
    </div>

    <!-- Nilai per mapel -->
    <div class="px-6 py-5">
      <h2 class="font-title-lg text-deep-navy dark:text-ice-white mb-4">Rekap Nilai per Mata Pelajaran</h2>
      <div v-if="rapor.rekapNilai.length" class="table-shell">
        <table class="table-base">
          <thead>
            <tr>
              <th>No</th>
              <th>Mata Pelajaran</th>
              <th>Jumlah Nilai</th>
              <th class="text-right">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rapor.rekapNilai" :key="r.mapel">
              <td>{{ i + 1 }}</td>
              <td class="font-label-md text-deep-navy dark:text-ice-white">{{ r.mapel }}</td>
              <td>{{ r.jumlah }}</td>
              <td class="text-right font-label-md text-deep-navy dark:text-ice-white">{{ r.rata }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-on-surface-variant dark:text-ice-white/60">Belum ada nilai yang tercatat pada periode ini.</p>
    </div>

    <!-- Skor & kehadiran & sikap -->
    <div class="px-6 pb-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card p-5">
          <h3 class="font-label-md uppercase tracking-wider text-on-surface-variant dark:text-ice-white/60 mb-3">Rincian Skor</h3>
          <div class="space-y-3">
            <div v-for="s in skorBars" :key="s.key">
              <div class="flex justify-between font-label-sm mb-1">
                <span class="text-on-surface-variant dark:text-ice-white/60">{{ s.label }}</span>
                <span class="text-deep-navy dark:text-ice-white">{{ persen(s.value) }}</span>
              </div>
              <div class="h-2 rounded-full bg-surface-variant dark:bg-white/10 overflow-hidden">
                <div class="h-full rounded-full" :class="s.color" :style="{ width: (s.value * 100).toFixed(1) + '%' }"></div>
              </div>
            </div>
            <div class="flex items-center justify-between pt-2">
              <span class="font-label-md text-on-surface-variant dark:text-ice-white/60">Skor SPK</span>
              <span class="font-headline-md text-deep-navy dark:text-ice-white">{{ rapor.skor.abk ? 'ABK' : formatSkor(rapor.skor.skor) }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="card p-5">
            <h3 class="font-label-md uppercase tracking-wider text-on-surface-variant dark:text-ice-white/60 mb-3">Kehadiran</h3>
            <div class="grid grid-cols-4 gap-2 mb-3">
              <div v-for="k in kehadiranStats" :key="k.key" class="text-center">
                <p class="font-headline-md text-deep-navy dark:text-ice-white">{{ k.nilai }}</p>
                <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">{{ k.label }}</p>
              </div>
            </div>
            <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60">
              Persentase hadir: <span class="font-label-md text-dark-teal dark:text-light-teal">{{ rapor.persenHadir === null ? '-' : rapor.persenHadir + '%' }}</span>
              <template v-if="rapor.totalHari"> dari {{ rapor.totalHari }} hari</template>
            </p>
          </div>

          <div class="card p-5">
            <h3 class="font-label-md uppercase tracking-wider text-on-surface-variant dark:text-ice-white/60 mb-3">Sikap</h3>
            <div v-if="rapor.ringkasSikap.length" class="space-y-2">
              <div v-for="s in rapor.ringkasSikap" :key="s.jenis" class="flex items-center justify-between font-body-md text-sm">
                <span class="text-on-surface-variant dark:text-ice-white/60">{{ s.jenis === 'spiritual' ? 'Spiritual' : 'Sosial' }}</span>
                <span class="font-label-md text-deep-navy dark:text-ice-white">{{ s.jumlah ? labelSikap(Math.round(s.rata)) : '-' }}</span>
              </div>
            </div>
            <p v-else class="font-body-md text-sm text-on-surface-variant dark:text-ice-white/60">Belum ada penilaian sikap.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rekomendasi -->
    <div v-if="rapor.rekomendasi" class="px-6 pb-5">
      <div class="card p-5 border-l-4 border-dark-teal">
        <h3 class="font-label-md uppercase tracking-wider text-deep-navy dark:text-ice-white mb-2">Rekomendasi untuk Ananda</h3>
        <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-2">{{ rapor.rekomendasi.pesan }}</p>
        <ul class="space-y-1.5">
          <li v-for="r in rapor.rekomendasi.daftar" :key="r" class="flex items-start gap-2 font-body-md text-sm">
            <span class="material-symbols-outlined text-[18px] text-dark-teal mt-0.5">favorite</span>
            {{ r }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Tanda tangan -->
    <div class="px-6 py-5 grid grid-cols-2 gap-6">
      <div class="text-center">
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-16">Orang Tua / Wali</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white border-t border-surface-variant dark:border-white/20 pt-2">( ................. )</p>
      </div>
      <div class="text-center">
        <p class="font-label-sm text-on-surface-variant dark:text-ice-white/60 mb-16">Kepala Sekolah</p>
        <p class="font-label-md text-deep-navy dark:text-ice-white border-t border-surface-variant dark:border-white/20 pt-2">( ................. )</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatSkor, formatTanggal, persen, labelSikap } from '../utils/format'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  rapor: { type: Object, required: true }
})

const printArea = ref(null)

const skorBars = computed(() => {
  if (props.rapor.skor.abk) return []
  const s = props.rapor.skor
  return [
    { key: 'akademik', label: 'Akademik', value: s.skorAkademik, color: 'bg-dark-teal' },
    { key: 'kehadiran', label: 'Kehadiran', value: s.skorKehadiran, color: 'bg-sky-600' },
    { key: 'sikap', label: 'Sikap', value: s.skorSikap, color: 'bg-purple-600' }
  ]
})

const kehadiranStats = computed(() => {
  const r = props.rapor.ringkasKehadiran
  return [
    { key: 'hadir', label: 'Hadir', nilai: r.hadir },
    { key: 'izin', label: 'Izin', nilai: r.izin },
    { key: 'sakit', label: 'Sakit', nilai: r.sakit },
    { key: 'alpa', label: 'Alpa', nilai: r.alpa }
  ]
})
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area,
  .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    inset: 0;
    box-shadow: none;
    border: none;
  }
}
</style>
