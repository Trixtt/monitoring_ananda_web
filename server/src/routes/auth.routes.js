import { Router } from 'express'
import {
  login,
  me,
  changePassword,
  updateProfile,
  unreadCount,
  listNotifikasi,
  bacaNotifikasi,
  bacaSemuaNotifikasi
} from '../controllers/authController.js'
import { auth } from '../middlewares/auth.js'
import { loginRateLimit } from '../middlewares/rateLimit.js'

const router = Router()

router.post('/login', loginRateLimit, login)
router.get('/me', auth, me)
router.post('/change-password', auth, changePassword)
router.put('/profile', auth, updateProfile)

router.get('/notifikasi', auth, unreadCount)
router.get('/notifikasi/list', auth, listNotifikasi)
router.patch('/notifikasi/:id/baca', auth, bacaNotifikasi)
router.patch('/notifikasi/baca-semua', auth, bacaSemuaNotifikasi)

export default router
