import bcrypt from 'bcryptjs'
import { initDb, sequelize, User, Kelas, TahunAjaran, Siswa, Mapel, SettingSpk, Artikel, Nilai, Kehadiran, Sikap } from './models/index.js'

const MAPELS = ['Matematika', 'Bahasa Indonesia', 'Ilmu Pengetahuan Alam', 'Ilmu Pengetahuan Sosial', 'Pendidikan Pancasila', 'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Seni Budaya dan Prakarya', 'Bahasa Inggris']

const NAMA_KELAS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']

const NAMA_L = ['Ahmad Budi Santoso', 'Budi Santoso', 'Citra Dewi Maharani', 'Dimas Aditya', 'Eka Putri', 'Fajar Nugroho', 'Gilang Ramadhan', 'Hendra Wijaya', 'Indra Gunawan', 'Joko Susilo', 'Kurniawan', 'Lukman Hakim', 'Muhammad Rizki', 'Naufal Fikri', 'Oscar Pratama', 'Putra Mahendra', 'Raka Saputra', 'Surya Adi', 'Teguh Prasetyo', 'Yoga Pratama']
const NAMA_P = ['Siti Aminah', 'Nur Aisyah', 'Dewi Lestari', 'Rina Wulandari', 'Maya Sari', 'Intan Permata', 'Laila Nurjanah', 'Putri Amelia', 'Ratna Dewi', 'Sri Rahayu', 'Winda Astuti', 'Zahra Alia']

const hash = (pw) => bcrypt.hashSync(pw, 10)

async function seed() {
  await initDb()
  await sequelize.sync({ force: true })

  const tahunAktif = await TahunAjaran.create({ nama: '2025/2026', isActive: true })
  const tahunLalu = await TahunAjaran.create({ nama: '2024/2025', isActive: false })

  const kelasList = []
  for (let i = 0; i < 6; i++) {
    kelasList.push(await Kelas.create({ nama: NAMA_KELAS[i], tingkat: i + 1 }))
  }

  const mapelList = []
  for (const m of MAPELS) {
    mapelList.push(await Mapel.create({ nama: m }))
  }

  const waliNama = [
    'Budi Santoso, S.Pd',
    'Siti Nurhaliza, S.Pd',
    'Agus Salim, S.Pd',
    'Rina Marlina, S.Pd',
    'Dedi Kurniawan, S.Pd',
    'Anita Wijaya, S.Pd'
  ]

  const waliKelas = []
  for (let i = 0; i < 6; i++) {
    waliKelas.push(
      await User.create({
        username: `wali${i + 1}`,
        password: hash('password123'),
        role: 'wali_kelas',
        name: waliNama[i],
        phone: `0812000000${i + 1}`,
        kelasId: kelasList[i].id,
        mustChangePassword: false,
        active: true
      })
    )
  }

  const kepalaSekolah = await User.create({
    username: 'kepsek',
    password: hash('password123'),
    role: 'kepala_sekolah',
    name: 'Dr. H. Ahmad Fauzi, M.Pd',
    phone: '081299999999',
    mustChangePassword: false,
    active: true
  })

  const admin = await User.create({
    username: 'admin',
    password: hash('admin123'),
    role: 'admin',
    name: 'Admin Sekolah (Operator)',
    phone: '081288888888',
    mustChangePassword: false,
    active: true
  })

  let no = 1
  const semuaSiswa = []
  const allNames = [...NAMA_L, ...NAMA_P]
  for (let k = 0; k < 6; k++) {
    const jumlah = 6 + (k % 3)
    for (let s = 0; s < jumlah; s++) {
      const nama = allNames[(no - 1) % allNames.length]
      const jenisKelamin = NAMA_L.includes(nama) ? 'L' : 'P'
      const siswa = await Siswa.create({
        nisn: `00${String(1000000000 + no).slice(0, 10)}`.slice(-10),
        nama,
        jenisKelamin,
        tanggalLahir: `201${k}-0${(s % 9) + 1}-1${(no % 8) + 1}`,
        tahunAngkatan: 2025,
        nomorAbsen: no,
        statusABK: no % 11 === 0,
        catatanABK: no % 11 === 0 ? 'Membutuhkan pendampingan khusus pada mata pelajaran Matematika.' : null,
        kelasId: kelasList[k].id,
        tahunAjaranId: tahunAktif.id
      })
      semuaSiswa.push(siswa)

      await User.create({
        username: `${siswa.tahunAngkatan}${String(siswa.nomorAbsen).padStart(3, '0')}`,
        password: hash(siswa.tanggalLahir.replaceAll('-', '')),
        role: 'orang_tua',
        name: `Orang Tua ${nama}`,
        phone: `0813${String(10000000 + no * 7).padStart(8, '0').slice(0, 8)}`,
        siswaId: siswa.id,
        mustChangePassword: true,
        active: true
      })

      no++
    }
  }

  const aktivitas = ['Ulangan Harian 1', 'Ulangan Harian 2', 'Tugas Proyek', 'Latihan Soal', 'Penilaian Tengah Semester']
  for (const siswa of semuaSiswa) {
    for (let m = 0; m < 4; m++) {
      await Nilai.create({
        siswaId: siswa.id,
        mapelId: mapelList[m].id,
        judul: aktivitas[m % aktivitas.length],
        nilai: 55 + Math.round(Math.random() * 45),
        tanggal: '2026-02-1' + ((m + 1) % 9),
        tahunAjaranId: tahunAktif.id
      })
    }
    for (let d = 0; d < 15; d++) {
      const r = Math.random()
      const status = r < 0.86 ? 'hadir' : r < 0.92 ? 'izin' : r < 0.97 ? 'sakit' : 'alpa'
      await Kehadiran.create({
        siswaId: siswa.id,
        tanggal: `2026-0${(d % 6) + 1}-${String((d % 28) + 1).padStart(2, '0')}`,
        status,
        tahunAjaranId: tahunAktif.id
      })
    }
    await Sikap.create({ siswaId: siswa.id, jenis: 'spiritual', nilai: 2 + Math.round(Math.random() * 2), tanggal: '2026-02-15', tahunAjaranId: tahunAktif.id })
    await Sikap.create({ siswaId: siswa.id, jenis: 'sosial', nilai: 2 + Math.round(Math.random() * 2), tanggal: '2026-02-15', tahunAjaranId: tahunAktif.id })
  }

  await SettingSpk.create({
    bobotAkademik: 0.31,
    bobotKehadiran: 0.31,
    bobotSikap: 0.38,
    intervalBaikBawah: 0.67,
    intervalPerhatianBawah: 0.34,
    intervalBerisikoBawah: 0.0
  })

  await Artikel.bulkCreate([
    {
      judul: 'Prestasi Gemilang Siswa SD Negeri 4 Keling di Olimpiade Sains Tingkat Kabupaten',
      kategori: 'Prestasi',
      isi: 'Kebanggaan luar biasa kembali dirasakan oleh seluruh keluarga besar SD Negeri 4 Keling. Pada ajang Olimpiade Sains tingkat kabupaten, kontingen sekolah berhasil meraih medali emas dan perak. Pihak sekolah akan terus memberikan dukungan penuh melalui program bimbingan intensif.',
      status: 'publish',
      authorId: admin.id,
      publishedAt: new Date('2026-02-10')
    },
    {
      judul: 'Penerapan Kurikulum Merdeka Berjalan Optimal di Kelas 4',
      kategori: 'Kegiatan',
      isi: 'Evaluasi paruh semester menunjukkan hasil positif dari penerapan metode pembelajaran berbasis proyek. Antusiasme belajar siswa meningkat signifikan dibanding tahun sebelumnya.',
      status: 'publish',
      authorId: admin.id,
      publishedAt: new Date('2026-02-05')
    },
    {
      judul: 'Jadwal Pengambilan Rapor Semester Genap Tahun Ajaran 2025/2026',
      kategori: 'Pengumuman',
      isi: 'Informasi penting bagi wali murid mengenai jadwal, tata tertib, dan lokasi pengambilan hasil evaluasi belajar siswa semester ini.',
      status: 'publish',
      authorId: admin.id,
      publishedAt: new Date('2026-01-28')
    },
    {
      judul: 'Draf: Rencana Kegiatan Pameran Sains Tahunan',
      kategori: 'Kegiatan',
      isi: 'Sedang disiapkan konsep pameran sains tahunan yang melibatkan seluruh kelas.',
      status: 'draft',
      authorId: admin.id
    }
  ])

  console.log('Seed selesai.')
  console.log('Login demo:')
  console.log('  admin / admin123')
  console.log('  kepsek / password123')
  for (let i = 0; i < 6; i++) console.log(`  wali${i + 1} / password123 (${NAMA_KELAS[i]})`)
  console.log('  Orang tua: username = tahun angkatan + no absen (mis. 2025001), password awal = tgl lahir YYYYMMDD (mis. 20100112, wajib diganti)')

  await sequelize.close()
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
