import { Router } from 'express'
import { ortuDashboard, ortuRekapNilai, ortuKehadiran, ortuSikap, ortuProfil, ortuRapor, ortuMonitoring } from '../controllers/ortuController.js'
import { auth, rbac } from '../middlewares/auth.js'

const router = Router()

router.use(auth, rbac('orang_tua'))

router.get('/dashboard', ortuDashboard)
router.get('/rekap-nilai', ortuRekapNilai)
router.get('/kehadiran', ortuKehadiran)
router.get('/sikap', ortuSikap)
router.get('/rapor', ortuRapor)
router.get('/profil', ortuProfil)
router.get('/monitoring', ortuMonitoring)

export default router
