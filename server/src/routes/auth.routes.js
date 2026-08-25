import { Router } from 'express'
import {
  login,
  logout,
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
import { validate, loginSchema, changePasswordSchema, profileSchema } from '../validators/index.js'

const router = Router()

router.post('/login', loginRateLimit, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', auth, me)
router.post('/change-password', auth, validate(changePasswordSchema), changePassword)
router.put('/profile', auth, validate(profileSchema), updateProfile)

router.get('/notifikasi', auth, unreadCount)
router.get('/notifikasi/list', auth, listNotifikasi)
router.patch('/notifikasi/:id/baca', auth, bacaNotifikasi)
router.patch('/notifikasi/baca-semua', auth, bacaSemuaNotifikasi)

export default router
