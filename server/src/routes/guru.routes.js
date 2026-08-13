import { Router } from 'express'
import {
  guruDashboard,
  guruSiswa,
  guruSiswaDetail,
  guruNilaiUnggah,
  guruNilaiPerMapel,
  guruKehadiranBulk,
  guruKehadiranByDate,
  guruSikapBulk,
  guruSikapBySiswa,
  daftarNilaiUntukWali,
  mapelList,
  guruMonitoring
} from '../controllers/guruController.js'
import {
  listKelas,
  updateAbk,
  suggestUsername
} from '../controllers/masterController.js'
import { auth, rbac } from '../middlewares/auth.js'
import { uploadSingle } from '../middlewares/upload.js'

const router = Router()

router.use(auth, rbac('wali_kelas', 'admin'))

router.get('/dashboard', guruDashboard)
router.get('/monitoring', guruMonitoring)
router.get('/siswa', guruSiswa)
router.get('/siswa/:id', guruSiswaDetail)
router.patch('/siswa/:id/abk', updateAbk)

router.post('/nilai', uploadSingle, guruNilaiUnggah)
router.get('/nilai/mapel', guruNilaiPerMapel)
router.get('/nilai', daftarNilaiUntukWali)

router.post('/kehadiran', guruKehadiranBulk)
router.get('/kehadiran', guruKehadiranByDate)

router.post('/sikap', guruSikapBulk)
router.get('/sikap/:siswaId', guruSikapBySiswa)

router.get('/mapel', mapelList)
router.get('/kelas', listKelas)
router.get('/suggest-username', suggestUsername)

export default router
