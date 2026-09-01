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
  guruMonitoring,
  guruKehadiranKalender
} from '../controllers/guruController.js'
import {
  listKelas,
  updateAbk,
  suggestUsername
} from '../controllers/masterController.js'
import { auth, rbac } from '../middlewares/auth.js'
import { uploadSingle } from '../middlewares/upload.js'
import { validate, nilaiSchema, kehadiranBulkSchema, sikapBulkSchema, abkSchema } from '../validators/index.js'

const router = Router()

router.use(auth, rbac('wali_kelas', 'admin'))

router.get('/dashboard', guruDashboard)
router.get('/monitoring', guruMonitoring)
router.get('/siswa', guruSiswa)
router.get('/siswa/:id', guruSiswaDetail)
router.patch('/siswa/:id/abk', validate(abkSchema), updateAbk)

router.post('/nilai', uploadSingle, validate(nilaiSchema), guruNilaiUnggah)
router.get('/nilai/mapel', guruNilaiPerMapel)
router.get('/nilai', daftarNilaiUntukWali)

router.post('/kehadiran', validate(kehadiranBulkSchema), guruKehadiranBulk)
router.get('/kehadiran/kalender', guruKehadiranKalender)
router.get('/kehadiran', guruKehadiranByDate)

router.post('/sikap', validate(sikapBulkSchema), guruSikapBulk)
router.get('/sikap/:siswaId', guruSikapBySiswa)

router.get('/mapel', mapelList)
router.get('/kelas', listKelas)
router.get('/suggest-username', suggestUsername)

export default router
