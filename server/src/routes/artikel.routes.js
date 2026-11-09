import { Router } from 'express'
import {
  listArtikel,
  detailArtikel,
  kategoriArtikel,
  createArtikel,
  updateArtikel,
  deleteArtikel
} from '../controllers/artikelController.js'
import { auth, optionalAuth, rbac } from '../middlewares/auth.js'
import { uploadGambarSingle } from '../middlewares/upload.js'
import { uploadRateLimit } from '../middlewares/rateLimit.js'
import { validate, artikelSchema, artikelUpdateSchema } from '../validators/index.js'

const router = Router()

// Publik: hanya artikel publish. Admin dengan sesi valid boleh melihat draft.
router.get('/', optionalAuth, listArtikel)
router.get('/kategori', kategoriArtikel)

// Detail: boleh publik, tapi hanya tampil draft ke admin
router.get('/:id', optionalAuth, detailArtikel)

// CRUD khusus admin
router.post('/', auth, rbac('admin'), uploadRateLimit, uploadGambarSingle, validate(artikelSchema), createArtikel)
router.put('/:id', auth, rbac('admin'), uploadRateLimit, uploadGambarSingle, validate(artikelUpdateSchema), updateArtikel)
router.delete('/:id', auth, rbac('admin'), deleteArtikel)

export default router
