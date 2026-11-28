/**
 * Konfigurasi terpusat untuk fitur Catatan Sikap.
 *
 * Angka pengurangan di bawah ini adalah KONFIGURASI TEKNIS AWAL sesuai arahan
 * pengguna, bukan angka resmi yang ditetapkan kepala sekolah. Jika sekolah
 * memberikan nilai resmi, ubah hanya berkas ini dan dokumentasikan perubahannya.
 * Jangan membuat halaman pengaturan bobot kasus baru tanpa permintaan.
 */

export const NILAI_DASAR_SIKAP = 100

export const ASPEK_SIKAP = Object.freeze(['sosial', 'spiritual'])

export const KATEGORI_SIKAP = Object.freeze([
  'Bolos',
  'Tidak mengerjakan tugas',
  'Berkelahi dengan teman',
  'Memalak uang teman',
  'Membully teman/perundungan',
  'Berbicara kotor kepada teman',
  'Tidak sopan kepada guru',
  'Lainnya'
])

export const PENGURANGAN_SIKAP = Object.freeze({
  // Bolos hanya berdampak pada kriteria Kehadiran (alpa), bukan pada Sikap.
  Bolos: 0,
  'Tidak mengerjakan tugas': 5,
  'Berkelahi dengan teman': 10,
  'Memalak uang teman': 20,
  'Membully teman/perundungan': 20,
  'Berbicara kotor kepada teman': 5,
  'Tidak sopan kepada guru': 10,
  Lainnya: 5
})

export function penguranganUntuk(kategori) {
  const nilai = PENGURANGAN_SIKAP[kategori]
  return Number.isFinite(nilai) ? nilai : 0
}

/**
 * Skor sikap dihitung dari nilai dasar 100 dikurangi pengurangan yang tersimpan
 * pada setiap catatan kejadian. Kategori Bolos membawa pengurangan 0.
 *
 * Catatan bersifat insidental: tanpa catatan, hasil tetap 100. Ini bukan
 * penilaian harian dan tidak boleh diberi predikat "Sangat Baik".
 */
export function hitungNilaiSikap(catatan = []) {
  const total = (Array.isArray(catatan) ? catatan : []).reduce((jumlah, item) => {
    if (item === null || item === undefined) return jumlah
    const mentah = typeof item === 'object'
      ? (item.pengurangan ?? penguranganUntuk(item.kategori))
      : item
    const nilai = Number(mentah)
    return jumlah + (Number.isFinite(nilai) && nilai > 0 ? nilai : 0)
  }, 0)
  return Math.max(0, NILAI_DASAR_SIKAP - total)
}
