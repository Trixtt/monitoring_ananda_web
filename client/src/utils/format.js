export const kategoriSiswa = {
  aman: { label: 'Baik / Aman', bg: 'bg-status-aman/15', text: 'text-status-aman', dot: 'bg-status-aman', icon: 'check_circle' },
  perhatian: { label: 'Perlu Perhatian', bg: 'bg-status-perhatian/20', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-status-perhatian', icon: 'priority_high' },
  berisiko: { label: 'Berisiko', bg: 'bg-status-berisiko/15', text: 'text-status-berisiko', dot: 'bg-status-berisiko', icon: 'warning' },
  abk: { label: 'ABK', bg: 'bg-status-abk/15', text: 'text-status-abk', dot: 'bg-status-abk', icon: 'accessibility_new' }
}

export function kategoriInfo(kode) {
  return kategoriSiswa[kode] || kategoriSiswa.aman
}

export const kehadiranMap = {
  hadir: { label: 'Hadir', cls: 'bg-status-aman/15 text-status-aman' },
  izin: { label: 'Izin', cls: 'bg-status-perhatian/20 text-yellow-700 dark:text-yellow-300' },
  sakit: { label: 'Sakit', cls: 'bg-ice-white text-dark-teal dark:bg-white/10 dark:text-light-teal' },
  alpa: { label: 'Alpa', cls: 'bg-status-berisiko/15 text-status-berisiko' }
}

export const labelSikap = {
  1: 'Kurang',
  2: 'Cukup',
  3: 'Baik',
  4: 'Sangat Baik'
}

export function formatTanggal(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatSkor(n) {
  if (n === null || n === undefined) return '-'
  return (Math.round(n * 1000) / 10).toFixed(1)
}

export function persen(n) {
  if (n === null || n === undefined) return '0%'
  return `${Math.round(n * 100)}%`
}

export function namaKelasSingkat(nama) {
  if (!nama) return '-'
  const s = String(nama).replace(/^kelas\s*/i, '').trim()
  return s || String(nama)
}
