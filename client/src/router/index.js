import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/public/LandingPage.vue'), meta: { public: true, title: 'Beranda', description: 'Sistem monitoring perkembangan siswa SD Negeri 4 Keling. Nilai, kehadiran, dan sikap dalam satu tempat.' } },
  { path: '/artikel', name: 'artikel-list', component: () => import('../views/public/ArticleList.vue'), meta: { public: true, title: 'Berita Sekolah', description: 'Berita dan pengumuman terbaru dari SD Negeri 4 Keling.' } },
  { path: '/artikel/:id', name: 'artikel-detail', component: () => import('../views/public/ArticleDetail.vue'), meta: { public: true, title: 'Artikel', description: 'Artikel dan berita SD Negeri 4 Keling.' } },
  { path: '/login', name: 'login', component: () => import('../views/auth/LoginPage.vue'), meta: { public: true, title: 'Masuk' } },
  { path: '/lupa-password', name: 'lupa-password', component: () => import('../views/auth/ForgotPassword.vue'), meta: { public: true, title: 'Lupa Password' } },
  { path: '/ganti-password', name: 'ganti-password', component: () => import('../views/auth/ForceChangePassword.vue'), meta: { auth: true, title: 'Buat Password Baru' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFound.vue'), meta: { public: true, title: 'Halaman Tidak Ditemukan' } },

  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { auth: true },
    children: [
      { path: 'profile', name: 'profile', component: () => import('../views/dashboard/ProfilePage.vue'), meta: { title: 'Profil & Kata Sandi' } },

      { path: 'guru', name: 'guru-dashboard', component: () => import('../views/guru/GuruDashboard.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Dashboard Wali Kelas' } },
      { path: 'guru/siswa', name: 'guru-siswa', component: () => import('../views/guru/GuruSiswa.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Data Siswa' } },
      { path: 'guru/siswa/:id', name: 'guru-siswa-detail', component: () => import('../views/guru/GuruSiswaDetail.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Detail Siswa' } },
      { path: 'guru/monitoring', name: 'guru-monitoring', component: () => import('../views/guru/GuruMonitoring.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Monitoring Perkembangan' } },
      { path: 'guru/nilai', name: 'guru-nilai', component: () => import('../views/guru/GuruNilai.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Input Nilai' } },
      { path: 'guru/nilai/riwayat', name: 'guru-nilai-riwayat', component: () => import('../views/guru/GuruNilaiRiwayat.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Riwayat Nilai' } },
      { path: 'guru/kehadiran', name: 'guru-kehadiran', component: () => import('../views/guru/GuruKehadiran.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Kehadiran' } },
      { path: 'guru/sikap', name: 'guru-sikap', component: () => import('../views/guru/GuruSikap.vue'), meta: { roles: ['wali_kelas', 'admin'], title: 'Penilaian Sikap' } },

      { path: 'kepsek', name: 'kepsek-dashboard', component: () => import('../views/kepsek/KepsekDashboard.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Dashboard Kepala Sekolah' } },
      { path: 'kepsek/rekap', name: 'kepsek-rekap', component: () => import('../views/kepsek/KepsekRekap.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Rekap per Kelas' } },
      { path: 'kepsek/rekap/:kelasId', name: 'kepsek-rekap-detail', component: () => import('../views/kepsek/KepsekRekapDetail.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Detail Kelas' } },
      { path: 'kepsek/laporan', name: 'kepsek-laporan', component: () => import('../views/kepsek/KepsekLaporan.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Laporan & Riwayat' } },
      { path: 'kepsek/siswa/:id', name: 'kepsek-siswa-detail', component: () => import('../views/kepsek/KepsekSiswaDetail.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Detail Siswa' } },
      { path: 'kepsek/rapor/:siswaId', name: 'kepsek-rapor', component: () => import('../views/kepsek/KepsekRapor.vue'), meta: { roles: ['kepala_sekolah', 'admin'], title: 'Rapor Siswa' } },

      { path: 'orangtua', name: 'ortu-dashboard', component: () => import('../views/orangtua/OrtuDashboard.vue'), meta: { roles: ['orang_tua'], title: 'Perkembangan Anak' } },
      { path: 'orangtua/nilai', name: 'ortu-nilai', component: () => import('../views/orangtua/OrtuNilai.vue'), meta: { roles: ['orang_tua'], title: 'Nilai Akademik' } },
      { path: 'orangtua/kehadiran', name: 'ortu-kehadiran', component: () => import('../views/orangtua/OrtuKehadiran.vue'), meta: { roles: ['orang_tua'], title: 'Kehadiran' } },
      { path: 'orangtua/sikap', name: 'ortu-sikap', component: () => import('../views/orangtua/OrtuSikap.vue'), meta: { roles: ['orang_tua'], title: 'Sikap' } },
      { path: 'orangtua/rekap', name: 'ortu-rekap', component: () => import('../views/orangtua/OrtuRekap.vue'), meta: { roles: ['orang_tua'], title: 'Rekap Perkembangan' } },
      { path: 'orangtua/rapor', name: 'ortu-rapor', component: () => import('../views/orangtua/OrtuRapor.vue'), meta: { roles: ['orang_tua'], title: 'Rapor Perkembangan' } },

      { path: 'admin', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { roles: ['admin'], title: 'Dashboard Admin' } },
      { path: 'admin/siswa', name: 'admin-siswa', component: () => import('../views/admin/AdminSiswa.vue'), meta: { roles: ['admin'], title: 'Data Siswa' } },
      { path: 'admin/kelas', name: 'admin-kelas', component: () => import('../views/admin/AdminKelas.vue'), meta: { roles: ['admin'], title: 'Kelas' } },
      { path: 'admin/mapel', name: 'admin-mapel', component: () => import('../views/admin/AdminMapel.vue'), meta: { roles: ['admin'], title: 'Mata Pelajaran' } },
      { path: 'admin/tahun-ajaran', name: 'admin-tahun-ajaran', component: () => import('../views/admin/AdminTahunAjaran.vue'), meta: { roles: ['admin'], title: 'Tahun Ajaran' } },
      { path: 'admin/akun', name: 'admin-akun', component: () => import('../views/admin/AdminAkun.vue'), meta: { roles: ['admin'], title: 'Manajemen Akun' } },
      { path: 'admin/spk', name: 'admin-spk', component: () => import('../views/admin/AdminSpk.vue'), meta: { roles: ['admin'], title: 'Konfigurasi SPK' } },
      { path: 'admin/artikel', name: 'admin-artikel', component: () => import('../views/admin/AdminArtikel.vue'), meta: { roles: ['admin'], title: 'Artikel & Berita' } },
      { path: 'admin/guru/:kelasId?', name: 'admin-masuk-guru', component: () => import('../views/guru/GuruDashboard.vue'), meta: { roles: ['admin'], title: 'Masuk sebagai Wali Kelas' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) {
      return auth.homePath
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const roleGuard = to.matched.find((record) => record.meta.roles)
  if (roleGuard && !roleGuard.meta.roles.includes(auth.role)) {
    return auth.homePath
  }

  if (to.name !== 'ganti-password' && auth.user?.mustChangePassword) {
    return { name: 'ganti-password' }
  }

  return true
})

export default router
