import { Router } from 'express'
import {
  kepsekRingkasan,
  kepsekSiswaDetail,
  kepsekSiswaRisiko,
  kepsekDetailKelas,
  kepsekGenerateLaporan,
  kepsekRiwayatLaporan,
  kepsekDetailLaporan,
  kepsekHapusLaporan,
  kepsekRapor
} from '../controllers/kepsekController.js'
import { auth, rbac } from '../middlewares/auth.js'

const router = Router()

router.use(auth, rbac('kepala_sekolah', 'admin'))

router.get('/ringkasan', kepsekRingkasan)
router.get('/siswa/:id', kepsekSiswaDetail)
router.get('/rapor/:siswaId', kepsekRapor)
router.get('/siswa-risiko', kepsekSiswaRisiko)
router.get('/kelas/:kelasId', kepsekDetailKelas)

router.get('/laporan', kepsekRiwayatLaporan)
router.post('/laporan', kepsekGenerateLaporan)
router.get('/laporan/:id', kepsekDetailLaporan)
router.delete('/laporan/:id', kepsekHapusLaporan)

export default router
