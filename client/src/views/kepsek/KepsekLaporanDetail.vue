<template>
  <div class="space-y-6">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 print-hide">
      <router-link to="/kepsek/laporan" class="btn-secondary">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </router-link>
      <div v-if="laporan" class="flex items-center gap-2">
        <button class="btn-secondary" @click="cetak">
          <span class="material-symbols-outlined text-[18px]">print</span>
          Cetak
        </button>
        <button class="btn-primary" :disabled="downloading" @click="unduhPdf">
          <span v-if="downloading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else class="material-symbols-outlined text-[18px]">download</span>
          {{ downloading ? 'Menyiapkan PDF…' : 'Unduh PDF' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <LoadingState v-if="loading" skeleton variant="table" />

    <!-- Error -->
    <div v-else-if="error" class="card p-8 text-center">
      <span class="material-symbols-outlined text-5xl text-error block mb-3">error</span>
      <p class="font-title-lg text-deep-navy dark:text-ice-white mb-1">{{ error }}</p>
      <p class="font-body-md text-on-surface-variant dark:text-ice-white/60 mb-5">Laporan mungkin telah dihapus atau tautan tidak valid.</p>
      <router-link to="/kepsek/laporan" class="btn-primary mx-auto">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Laporan
      </router-link>
    </div>

    <!-- Dokumen -->
    <div v-else-if="laporan" class="doc-backdrop">
      <div id="print-doc" class="doc-sheet">
        <!-- Kop surat -->
        <header class="kop">
          <img src="/logo.svg" alt="Logo SD Negeri 4 Keling" class="kop-logo" />
          <div class="kop-text">
            <p class="kop-line1">Pemerintah Kabupaten Jepara</p>
            <p class="kop-line2">Dinas Pendidikan</p>
            <p class="kop-sekolah">SD Negeri 4 Keling</p>
            <p class="kop-alamat">Kecamatan Keling, Kabupaten Jepara, Jawa Tengah</p>
          </div>
          <span class="kop-spacer" aria-hidden="true"></span>
        </header>
        <div class="kop-rule-thick"></div>
        <div class="kop-rule-thin"></div>

        <!-- Judul surat -->
        <div class="doc-title">
          <p class="doc-title-main">Laporan Monitoring Perkembangan Siswa</p>
          <p class="doc-title-sub">{{ laporan.judul }}</p>
        </div>

        <!-- Info laporan -->
        <table class="info">
          <tbody>
            <tr>
              <td class="info-label">Nomor Laporan</td>
              <td class="info-colon">:</td>
              <td>{{ nomorLaporan }}</td>
            </tr>
            <tr>
              <td class="info-label">Kelas</td>
              <td class="info-colon">:</td>
              <td>{{ laporan.kelasNama || 'Semua Kelas' }}</td>
            </tr>
            <tr>
              <td class="info-label">Kategori Kondisi</td>
              <td class="info-colon">:</td>
              <td>{{ kategoriLabel(laporan.kategori) }}</td>
            </tr>
            <tr>
              <td class="info-label">Periode Data</td>
              <td class="info-colon">:</td>
              <td>{{ periodeLabel(laporan) }}</td>
            </tr>
            <tr>
              <td class="info-label">Jumlah Siswa</td>
              <td class="info-colon">:</td>
              <td>{{ list.length }} siswa</td>
            </tr>
            <tr>
              <td class="info-label">Tanggal Dibuat</td>
              <td class="info-colon">:</td>
              <td>{{ formatTanggal(laporan.createdAt) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Tabel data -->
        <table class="data">
          <thead>
            <tr>
              <th class="c w-no">No</th>
              <th class="w-nisn">NISN</th>
              <th>Nama Siswa</th>
              <th class="w-kelas">Kelas</th>
              <th class="c w-skor">Skor</th>
              <th class="w-kondisi">Kondisi</th>
              <th class="w-mapel">Mapel Terlemah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in list" :key="item.siswa.id">
              <td class="c">{{ i + 1 }}</td>
              <td>{{ item.siswa.nisn }}</td>
              <td>
                {{ item.siswa.nama }}
                <span v-if="item.siswa.statusABK" class="text-abk">(ABK)</span>
              </td>
              <td>{{ namaKelasSingkat(item.siswa.kelas?.nama) }}</td>
              <td class="c">{{ item.skor.abk ? '-' : formatSkor(item.skor.skor) }}</td>
              <td>{{ kategoriLabel(item.skor.kategori?.kode) }}</td>
              <td>{{ item.mapelTerlemah || '-' }}</td>
            </tr>
            <tr v-if="!list.length">
              <td colspan="7" class="c empty-row">Tidak ada data siswa pada laporan ini.</td>
            </tr>
          </tbody>
        </table>

        <!-- Rekap kondisi -->
        <p class="recap" v-if="list.length">
          Jumlah: Baik/Aman {{ recap.aman }} siswa &middot; Perlu Perhatian {{ recap.perhatian }} siswa &middot; Berisiko {{ recap.berisiko }} siswa &middot; ABK {{ recap.abk }} siswa.
        </p>

        <!-- Tanda tangan -->
        <div class="ttd">
          <p>Keling, {{ tanggalCetak }}</p>
          <p>Kepala Sekolah,</p>
          <div class="ttd-space"></div>
          <p class="ttd-nama">{{ namaTtd }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatSkor, formatTanggal } from '../../utils/format'
import LoadingState from '../../components/LoadingState.vue'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

const laporan = ref(null)
const list = ref([])
const loading = ref(true)
const error = ref('')
const downloading = ref(false)

const kategoriLabels = {
  aman: 'Baik / Aman',
  perhatian: 'Perlu Perhatian',
  berisiko: 'Berisiko',
  abk: 'ABK'
}

function kategoriLabel(k) {
  return kategoriLabels[k] || k || 'Semua Kondisi'
}

function periodeLabel(l) {
  if (!l.tanggalMulai && !l.tanggalAkhir) return 'Seluruh Periode'
  return `${l.tanggalMulai || '…'} s/d ${l.tanggalAkhir || '…'}`
}

const bulanPanjang = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function tanggalPanjang(iso) {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getDate()} ${bulanPanjang[d.getMonth()]} ${d.getFullYear()}`
}

const tanggalCetak = tanggalPanjang()

const nomorLaporan = computed(() => {
  if (!laporan.value) return '-'
  const d = new Date(laporan.value.createdAt)
  return `${String(laporan.value.id).padStart(3, '0')}/LP/SDN-4K/${d.getFullYear()}`
})

const recap = computed(() => {
  const c = { aman: 0, perhatian: 0, berisiko: 0, abk: 0 }
  for (const item of list.value) {
    const k = item.skor?.kategori?.kode
    if (k in c) c[k]++
  }
  return c
})

const namaTtd = computed(() => laporan.value?.dibuatOleh?.name || auth.user?.name || '-')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/kepsek/laporan/${route.params.id}`)
    laporan.value = data.laporan
    list.value = data.list || []
  } catch (e) {
    laporan.value = null
    error.value =
      e.response?.status === 404
        ? 'Laporan tidak ditemukan.'
        : e.response?.data?.message || 'Gagal memuat laporan.'
  } finally {
    loading.value = false
  }
}

function cetak() {
  window.print()
}

function namaFile() {
  const slug = (laporan.value?.judul || 'laporan-monitoring-siswa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slug}-${laporan.value?.id ?? ''}.pdf`
}

function namaKelasSingkat(nama) {
  if (!nama) return '-'
  const s = String(nama).replace(/^kelas\s*/i, '').trim()
  return s || String(nama)
}

let logoPngCache = null

function loadLogoPng() {
  if (logoPngCache !== null) return Promise.resolve(logoPngCache)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = 256
        c.height = 256
        c.getContext('2d').drawImage(img, 0, 0, 256, 256)
        logoPngCache = c.toDataURL('image/png')
      } catch {
        logoPngCache = null
      }
      resolve(logoPngCache)
    }
    img.onerror = () => {
      logoPngCache = null
      resolve(null)
    }
    img.src = '/logo.svg'
  })
}

async function unduhPdf() {
  if (!laporan.value || downloading.value) return
  downloading.value = true
  try {
    const logo = await loadLogoPng()

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pw = 210
    const ph = 297
    const ml = 15
    const mr = 15
    const cw = pw - ml - mr
    const cx = pw / 2
    let y = 12

    // Kop surat
    if (logo) {
      doc.addImage(logo, 'PNG', ml, y + 1.5, 20, 20)
    }
    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.text('PEMERINTAH KABUPATEN JEPARA', cx, y + 5, { align: 'center' })
    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    doc.text('DINAS PENDIDIKAN', cx, y + 10.5, { align: 'center' })
    doc.setFontSize(17)
    doc.text('SD NEGERI 4 KELING', cx, y + 16.5, { align: 'center' })
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.text('Kecamatan Keling, Kabupaten Jepara, Jawa Tengah', cx, y + 21, { align: 'center' })

    y += 23.5
    doc.setLineWidth(0.8)
    doc.line(ml, y, pw - mr, y)
    y += 1.3
    doc.setLineWidth(0.25)
    doc.line(ml, y, pw - mr, y)
    y += 10

    // Judul surat
    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    const judulUtama = 'LAPORAN MONITORING PERKEMBANGAN SISWA'
    doc.text(judulUtama, cx, y, { align: 'center' })
    const jw = doc.getTextWidth(judulUtama)
    doc.setLineWidth(0.3)
    doc.line(cx - jw / 2, y + 1.4, cx + jw / 2, y + 1.4)
    y += 6.5
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    const subLines = doc.splitTextToSize(laporan.value.judul, cw)
    doc.text(subLines, cx, y, { align: 'center' })
    y += subLines.length * 5 + 5

    // Info laporan
    const infoRows = [
      ['Nomor Laporan', nomorLaporan.value],
      ['Kelas', laporan.value.kelasNama || 'Semua Kelas'],
      ['Kategori Kondisi', kategoriLabel(laporan.value.kategori)],
      ['Periode Data', periodeLabel(laporan.value)],
      ['Jumlah Siswa', `${list.value.length} siswa`],
      ['Tanggal Dibuat', formatTanggal(laporan.value.createdAt)]
    ]
    doc.setFontSize(11)
    for (const [label, value] of infoRows) {
      doc.setFont('times', 'bold')
      doc.text(label, ml, y)
      doc.setFont('times', 'normal')
      doc.text(':', ml + 40, y)
      doc.text(String(value), ml + 44, y)
      y += 5.4
    }
    y += 3

    // Tabel data
    if (list.value.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        head: [['No', 'NISN', 'Nama Siswa', 'Kelas', 'Skor', 'Kondisi', 'Mapel Terlemah']],
        body: list.value.map((item, i) => [
          i + 1,
          item.siswa.nisn,
          item.siswa.statusABK ? `${item.siswa.nama} (ABK)` : item.siswa.nama,
          namaKelasSingkat(item.siswa.kelas?.nama),
          item.skor.abk ? '-' : formatSkor(item.skor.skor),
          kategoriLabel(item.skor.kategori?.kode),
          item.mapelTerlemah || '-'
        ]),
        theme: 'grid',
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 1.8,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          font: 'times',
          fontStyle: 'bold',
          fillColor: [232, 232, 232],
          textColor: [0, 0, 0],
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 24 },
          3: { cellWidth: 18 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 30 }
        }
      })
      y = doc.lastAutoTable.finalY + 7

      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      const recapText = `Jumlah: Baik/Aman ${recap.value.aman} siswa, Perlu Perhatian ${recap.value.perhatian} siswa, Berisiko ${recap.value.berisiko} siswa, ABK ${recap.value.abk} siswa.`
      doc.text(doc.splitTextToSize(recapText, cw), ml, y)
      y += doc.splitTextToSize(recapText, cw).length * 4.6 + 4
    } else {
      doc.setFont('times', 'italic')
      doc.setFontSize(10)
      doc.text('Tidak ada data siswa pada laporan ini.', ml, y)
      y += 8
    }

    // Tanda tangan
    if (y + 42 > ph - 14) {
      doc.addPage()
      y = 18
    }
    const scx = pw - mr - 35
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`Keling, ${tanggalCetak}`, scx, y, { align: 'center' })
    y += 5.5
    doc.text('Kepala Sekolah,', scx, y, { align: 'center' })
    y += 20
    doc.setFont('times', 'bold')
    doc.text(namaTtd.value, scx, y, { align: 'center' })
    const nw = doc.getTextWidth(namaTtd.value)
    doc.setLineWidth(0.25)
    doc.line(scx - nw / 2, y + 0.9, scx + nw / 2, y + 0.9)

    doc.save(namaFile())
    toast.success('PDF berhasil diunduh.')
  } catch (e) {
    console.error('Unduh PDF gagal:', e)
    toast.error(`Gagal mengunduh PDF: ${e?.message || 'kesalahan tidak diketahui'}`)
  } finally {
    downloading.value = false
  }
}

onMounted(load)

watch(
  () => route.params.id,
  () => {
    if (route.name === 'kepsek-laporan-detail') load()
  }
)
</script>

<style scoped>
.doc-backdrop {
  @apply rounded-xl border border-surface-variant/70 dark:border-white/10 bg-surface-container-low dark:bg-white/5 p-4 md:p-8 overflow-x-auto;
}

.doc-sheet {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  font-family: 'Times New Roman', 'Liberation Serif', Times, serif;
  font-size: 11pt;
  line-height: 1.45;
  padding: 14mm 16mm;
  box-shadow: 0 16px 40px -12px rgba(7, 25, 82, 0.22);
}

/* Kop surat */
.kop {
  display: flex;
  align-items: center;
  gap: 6mm;
}
.kop-logo,
.kop-spacer {
  width: 20mm;
  height: 20mm;
  flex-shrink: 0;
}
.kop-text {
  flex: 1;
  text-align: center;
  line-height: 1.25;
}
.kop-line1 {
  font-size: 12.5pt;
  text-transform: uppercase;
}
.kop-line2 {
  font-size: 14pt;
  font-weight: bold;
  text-transform: uppercase;
}
.kop-sekolah {
  font-size: 19pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin: 0.8mm 0;
}
.kop-alamat {
  font-size: 9.5pt;
}
.kop-rule-thick {
  border-bottom: 3px solid #000;
  margin-top: 2mm;
}
.kop-rule-thin {
  border-bottom: 1px solid #000;
  margin-top: 1.2mm;
}

/* Judul surat */
.doc-title {
  text-align: center;
  margin: 8mm 0 6mm;
}
.doc-title-main {
  font-size: 13pt;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: underline;
  letter-spacing: 0.02em;
}
.doc-title-sub {
  font-size: 11pt;
  margin-top: 1.5mm;
}

/* Info laporan */
.info {
  margin: 0 0 6mm;
  border-collapse: collapse;
  font-size: 11pt;
}
.info td {
  padding: 0.6mm 0;
  vertical-align: top;
}
.info-label {
  width: 38mm;
}
.info-colon {
  width: 5mm;
  text-align: center;
}

/* Tabel data */
.data {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.data th,
.data td {
  border: 1px solid #000;
  padding: 1.6mm 2mm;
}
.data th {
  background: #e8e8e8;
  font-weight: bold;
  text-align: center;
}
.data td {
  vertical-align: top;
}
.data .c {
  text-align: center;
}
.data thead {
  display: table-header-group;
}
.data tr {
  break-inside: avoid;
  page-break-inside: avoid;
}
.w-no {
  width: 10mm;
}
.w-nisn {
  width: 24mm;
}
.w-kelas {
  width: 18mm;
}
.w-skor {
  width: 16mm;
}
.w-kondisi {
  width: 32mm;
}
.empty-row {
  text-align: center;
  padding: 4mm 0;
}
.text-abk {
  font-style: italic;
  font-size: 9.5pt;
}

/* Rekap */
.recap {
  font-size: 10.5pt;
  margin-top: 3mm;
}

/* Tanda tangan */
.ttd {
  margin-top: 12mm;
  margin-left: auto;
  width: 72mm;
  text-align: center;
  font-size: 11pt;
  line-height: 1.5;
}
.ttd-space {
  height: 18mm;
}
.ttd-nama {
  font-weight: bold;
  text-decoration: underline;
}
</style>

<style>
@page {
  size: A4 portrait;
  margin: 12mm 14mm;
}

@media print {
  html,
  body {
    background: #fff !important;
  }
  body * {
    visibility: hidden;
  }
  #print-doc,
  #print-doc * {
    visibility: visible;
  }
  #print-doc {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    min-height: 0;
    margin: 0;
    padding: 0;
    box-shadow: none !important;
    break-inside: auto;
  }
  .print-hide {
    display: none !important;
  }
}
</style>
