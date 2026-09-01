import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { formatTanggal } from './format'

const bulanPanjang = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function tanggalPanjang(iso) {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getDate()} ${bulanPanjang[d.getMonth()]} ${d.getFullYear()}`
}

function namaFile(siswa) {
  const slug = (siswa?.nama || 'rapor-siswa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `rapor-${slug}.pdf`
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

export async function unduhRaporPdf(rapor) {
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
  const judulUtama = 'RAPOR PERKEMBANGAN SISWA'
  doc.text(judulUtama, cx, y, { align: 'center' })
  const jw = doc.getTextWidth(judulUtama)
  doc.setLineWidth(0.3)
  doc.line(cx - jw / 2, y + 1.4, cx + jw / 2, y + 1.4)
  y += 8

  // Identitas siswa
  const siswa = rapor.siswa || {}
  const identitas = [
    ['Nama Lengkap', siswa.nama || '-'],
    ['NISN', siswa.nisn || '-'],
    ['Kelas', siswa.kelas?.nama || '-'],
    ['Nomor Absen', siswa.nomorAbsen || '-'],
    ['Wali Kelas', siswa.kelas?.waliKelas || '-'],
    ['Tahun Ajaran', rapor.tahunAjaran || '-'],
    ['Tanggal Rapor', formatTanggal(rapor.tanggalRapor)]
  ]
  doc.setFontSize(11)
  for (const [label, value] of identitas) {
    doc.setFont('times', 'bold')
    doc.text(label, ml, y)
    doc.setFont('times', 'normal')
    doc.text(':', ml + 38, y)
    doc.text(String(value), ml + 42, y)
    y += 5.6
  }
  y += 4

  // Tabel nilai per mapel
  const rekapNilai = (rapor.rekapNilai || []).map((r) => [r.mapel, r.rata])
  if (rekapNilai.length) {
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.text('Rekap Nilai per Mata Pelajaran', ml, y)
    y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: ml, right: mr },
      head: [['No', 'Mata Pelajaran', 'Nilai Akhir']],
      body: rekapNilai.map(([mapel, rata], i) => [i + 1, mapel, rata]),
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
        0: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    })
    y = doc.lastAutoTable.finalY + 7
  } else {
    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    doc.text('Belum ada nilai yang tercatat pada periode ini.', ml, y)
    y += 8
  }

  // Ringkasan kehadiran
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Ringkasan Kehadiran', ml, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  const k = rapor.ringkasKehadiran || {}
  const kehadiranText = `Hadir ${k.hadir}, Izin ${k.izin}, Sakit ${k.sakit}, Alpa ${k.alpa}`
  doc.text(kehadiranText, ml, y)
  y += 5
  const persenHadir = rapor.persenHadir === null || rapor.persenHadir === undefined
    ? '-'
    : `${rapor.persenHadir}%`
  doc.text(`Persentase kehadiran: ${persenHadir}${rapor.totalHari ? ` dari ${rapor.totalHari} hari` : ''}`, ml, y)
  y += 7

  // Ringkasan sikap
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Ringkasan Sikap', ml, y)
  y += 5
  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  const ringkasSikap = rapor.ringkasSikap || []
  if (ringkasSikap.length) {
    ringkasSikap.forEach((s) => {
      const label = s.jenis === 'spiritual' ? 'Spiritual' : 'Sosial'
      const nilai = s.jumlah ? formatSikap(Math.round(s.rata)) : '-'
      doc.text(`${label}: ${nilai}`, ml, y)
      y += 5
    })
  } else {
    doc.text('Belum ada penilaian sikap.', ml, y)
    y += 5
  }
  y += 4

  // Rekomendasi
  if (rapor.rekomendasi) {
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('Rekomendasi', ml, y)
    y += 5
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    const pesan = doc.splitTextToSize(rapor.rekomendasi.pesan || '', cw)
    doc.text(pesan, ml, y)
    y += pesan.length * 4.6 + 3
    const daftar = rapor.rekomendasi.daftar || []
    daftar.forEach((r) => {
      const lines = doc.splitTextToSize(`- ${r}`, cw - 4)
      doc.text(lines, ml + 4, y)
      y += lines.length * 4.6 + 1
    })
    y += 4
  }

  // Tanda tangan
  if (y + 42 > ph - 14) {
    doc.addPage()
    y = 18
  }
  const scx = pw - mr - 35
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text(`Keling, ${tanggalPanjang(rapor.tanggalRapor)}`, scx, y, { align: 'center' })
  y += 5.5
  doc.text('Kepala Sekolah,', scx, y, { align: 'center' })
  y += 20
  doc.setFont('times', 'bold')
  doc.text('( ................. )', scx, y, { align: 'center' })

  doc.save(namaFile(siswa))
}

function formatSikap(n) {
  const labels = { 1: 'Kurang', 2: 'Cukup', 3: 'Baik', 4: 'Sangat Baik' }
  return labels[n] || n
}
