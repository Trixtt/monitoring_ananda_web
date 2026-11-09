import bcrypt from 'bcryptjs'
import {
  initDb,
  sequelize,
  User,
  Kelas,
  TahunAjaran,
  Siswa,
  Mapel,
  SettingSpk,
  Artikel,
  Nilai,
  Kehadiran,
  Sikap,
  Notifikasi,
  Laporan,
  AuditLog
} from './models/index.js'
import { Op } from 'sequelize'

const MAPELS = ['Matematika', 'Bahasa Indonesia', 'Ilmu Pengetahuan Alam', 'Ilmu Pengetahuan Sosial', 'Pendidikan Pancasila', 'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Seni Budaya dan Prakarya', 'Bahasa Inggris']

const NAMA_KELAS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']

const NAMA_L = ['Ahmad Budi Santoso', 'Budi Santoso', 'Citra Dewi Maharani', 'Dimas Aditya', 'Eka Putri', 'Fajar Nugroho', 'Gilang Ramadhan', 'Hendra Wijaya', 'Indra Gunawan', 'Joko Susilo', 'Kurniawan', 'Lukman Hakim', 'Muhammad Rizki', 'Naufal Fikri', 'Oscar Pratama', 'Putra Mahendra', 'Raka Saputra', 'Surya Adi', 'Teguh Prasetyo', 'Yoga Pratama']
const NAMA_P = ['Siti Aminah', 'Nur Aisyah', 'Dewi Lestari', 'Rina Wulandari', 'Maya Sari', 'Intan Permata', 'Laila Nurjanah', 'Putri Amelia', 'Ratna Dewi', 'Sri Rahayu', 'Winda Astuti', 'Zahra Alia']

const hash = (pw) => bcrypt.hashSync(pw, 10)

// Kredensial demo. Hanya dipakai oleh seed, dan seed menolak berjalan
// di produksi kecuali SEED_ALLOW_PRODUCTION=true secara eksplisit.
const DEMO_PASSWORD = {
  admin: process.env.DEMO_ADMIN_PASSWORD || 'Admin#2026',
  kepsek: process.env.DEMO_KEPSEK_PASSWORD || 'Kepsek#2026',
  wali: process.env.DEMO_WALI_PASSWORD || 'Wali#2026',
  orangTua: process.env.DEMO_ORANGTUA_PASSWORD || 'Ortu#2026'
}
const waliNama = [
  'Budi Santoso, S.Pd',
  'Siti Nurhaliza, S.Pd',
  'Agus Salim, S.Pd',
  'Rina Marlina, S.Pd',
  'Dedi Kurniawan, S.Pd',
  'Anita Wijaya, S.Pd'
]

async function cari(where) {
  return (await User.findOne({ where })) != null
}

async function hapusDataDemo() {
  // Hapus data demo tanpa menjatuhkan skema. Urutan penting: tabel anak
  // lebih dulu agar tidak melanggar foreign key. Migrasi & audit_logs
  // tetap utuh.
  const urutan = [
    Notifikasi,
    Laporan,
    Artikel,
    Nilai,
    Kehadiran,
    Sikap,
    AuditLog,
    User,
    Siswa,
    Mapel,
    Kelas,
    TahunAjaran,
    SettingSpk
  ]
  for (const Model of urutan) {
    await Model.destroy({ where: {} })
  }
}

async function seed() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error('Seed demo ditolak di produksi. Set SEED_ALLOW_PRODUCTION=true hanya jika benar-benar disengaja.')
  }
  const force = process.env.SEED_FORCE === 'true'
  await initDb()
  // Skema dikelola oleh migrasi (DB_SYNC=none) atau sequelize.sync() non-destruktif.
  // SEED_FORCE hanya menghapus baris data demo, bukan tabel.
  if (force) await hapusDataDemo()

  const sudahAda = await cari({ username: 'admin' })
  if (sudahAda && !force) {
    console.log('Seed dilewati: data demo sudah ada (atau isi ulang dengan SEED_FORCE=true).')
    await sequelize.close()
    return
  }

  const tahunAktif = await TahunAjaran.findOne({ where: { isActive: true } })
  const taAktif = tahunAktif || (await TahunAjaran.create({ nama: '2025/2026', isActive: true }))
  await TahunAjaran.findOrCreate({ where: { nama: '2024/2025' }, defaults: { nama: '2024/2025', isActive: false } })

  const kelasList = []
  for (let i = 0; i < 6; i++) {
    const [kelas] = await Kelas.findOrCreate({
      where: { nama: NAMA_KELAS[i] },
      defaults: { nama: NAMA_KELAS[i], tingkat: i + 1 }
    })
    kelasList.push(kelas)
  }

  const mapelList = []
  for (const m of MAPELS) {
    const [item] = await Mapel.findOrCreate({ where: { nama: m }, defaults: { nama: m } })
    mapelList.push(item)
  }

  const waliKelas = []
  for (let i = 0; i < 6; i++) {
    const username = `wali${i + 1}`
    if (await cari({ username })) {
      waliKelas.push(await User.findOne({ where: { username } }))
      continue
    }
    const u = await User.create({
      username,
      password: hash(DEMO_PASSWORD.wali),
      role: 'wali_kelas',
      name: waliNama[i],
      phone: `0812000000${i + 1}`,
      kelasId: kelasList[i].id,
      mustChangePassword: false,
      active: true
    })
    waliKelas.push(u)
    await kelasList[i].update({ waliKelas: u.name })
  }

  if (!(await cari({ username: 'kepsek' }))) {
    await User.create({
      username: 'kepsek',
      password: hash(DEMO_PASSWORD.kepsek),
      role: 'kepala_sekolah',
      name: 'Dr. H. Ahmad Fauzi, M.Pd',
      phone: '081299999999',
      mustChangePassword: false,
      active: true
    })
  }

  let admin
  if (!(await cari({ username: 'admin' }))) {
    admin = await User.create({
      username: 'admin',
      password: hash(DEMO_PASSWORD.admin),
      role: 'admin',
      name: 'Admin Sekolah (Operator)',
      phone: '081288888888',
      mustChangePassword: false,
      active: true
    })
  } else {
    admin = await User.findOne({ where: { username: 'admin' } })
  }

  const semuaSiswa = []
  const allNames = [...NAMA_L, ...NAMA_P]
  let no = 1
  for (let k = 0; k < 6; k++) {
    const jumlah = 6 + (k % 3)
    for (let s = 0; s < jumlah; s++) {
      const nama = allNames[(no - 1) % allNames.length]
      const jenisKelamin = NAMA_L.includes(nama) ? 'L' : 'P'
      const tahunAngkatan = 2025
      const nomorAbsen = no
      const username = `${tahunAngkatan}${String(nomorAbsen).padStart(3, '0')}`
      const siswaBaru = await Siswa.create({
        nisn: `${String(1000000000 + no).slice(-10)}`,
        nama,
        jenisKelamin,
        tanggalLahir: `201${k}-0${(s % 9) + 1}-1${(no % 8) + 1}`,
        tahunAngkatan,
        nomorAbsen,
        statusABK: no % 11 === 0,
        catatanABK: no % 11 === 0 ? 'Membutuhkan pendampingan khusus pada mata pelajaran Matematika.' : null,
        kelasId: kelasList[k].id,
        tahunAjaranId: taAktif.id
      })
      semuaSiswa.push(siswaBaru)

      if (!(await cari({ username }))) {
        await User.create({
          username,
          password: hash(DEMO_PASSWORD.orangTua),
          role: 'orang_tua',
          name: `Orang Tua ${nama}`,
          phone: `0813${String(10000000 + no * 7).padStart(8, '0').slice(0, 8)}`,
          siswaId: siswaBaru.id,
          mustChangePassword: false,
          active: true
        })
      }

      no++
    }
  }

  const adaNilai = await Nilai.count() > 0
  if (!adaNilai) {
    const aktivitas = ['Ulangan Harian 1', 'Ulangan Harian 2', 'Tugas Proyek', 'Latihan Soal', 'Penilaian Tengah Semester']
    for (const siswa of semuaSiswa) {
      for (let m = 0; m < 4; m++) {
        await Nilai.create({
          siswaId: siswa.id,
          mapelId: mapelList[m].id,
          judul: aktivitas[m % aktivitas.length],
          nilai: 55 + Math.round(Math.random() * 45),
          tanggal: '2026-02-1' + ((m + 1) % 9),
          tahunAjaranId: taAktif.id
        })
      }
      for (let d = 0; d < 15; d++) {
        const r = Math.random()
        const status = r < 0.86 ? 'hadir' : r < 0.92 ? 'izin' : r < 0.97 ? 'sakit' : 'alpa'
        await Kehadiran.create({
          siswaId: siswa.id,
          tanggal: `2026-0${(d % 6) + 1}-${String((d % 28) + 1).padStart(2, '0')}`,
          status,
          tahunAjaranId: taAktif.id
        })
      }
      await Sikap.create({ siswaId: siswa.id, jenis: 'spiritual', nilai: 2 + Math.round(Math.random() * 2), tanggal: '2026-02-15', tahunAjaranId: taAktif.id })
      await Sikap.create({ siswaId: siswa.id, jenis: 'sosial', nilai: 2 + Math.round(Math.random() * 2), tanggal: '2026-02-15', tahunAjaranId: taAktif.id })
    }
  }

  const spkAda = (await SettingSpk.count()) > 0
  if (!spkAda) {
    await SettingSpk.create({
      bobotAkademik: 0.31,
      bobotKehadiran: 0.31,
      bobotSikap: 0.38,
      intervalBaikBawah: 0.67,
      intervalPerhatianBawah: 0.34,
      intervalBerisikoBawah: 0.0
    })
  }

  if (!(await Artikel.findOne({ where: { judul: { [Op.like]: '%Prestasi Gemilang%' } } }))) {
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
  }

  console.log('Seed selesai.')
  if (process.env.NODE_ENV !== 'production') {
    console.log('Login demo (hanya untuk lingkungan demo):')
    console.log(`  admin / ${DEMO_PASSWORD.admin}`)
    console.log(`  kepsek / ${DEMO_PASSWORD.kepsek}`)
    for (let i = 0; i < 6; i++) console.log(`  wali${i + 1} / ${DEMO_PASSWORD.wali} (${NAMA_KELAS[i]})`)
    console.log(`  Orang tua: username = tahun angkatan + no absen (mis. 2025001), password demo = ${DEMO_PASSWORD.orangTua}`)
  }

  await sequelize.close()
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
