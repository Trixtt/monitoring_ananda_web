import { Router } from 'express'
import {
  listArtikel,
  detailArtikel,
  kategoriArtikel,
  createArtikel,
  updateArtikel,
  deleteArtikel
} from '../controllers/artikelController.js'
import { auth, rbac } from '../middlewares/auth.js'
import { uploadSingle } from '../middlewares/upload.js'

const router = Router()

// Publik: artikel yang sudah publish
router.get('/', listArtikel)
router.get('/kategori', kategoriArtikel)

// Detail: boleh publik, tapi hanya tampil draft ke admin
router.get('/:id', (req, res, next) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return next()
  auth(req, res, next)
}, detailArtikel)

// CRUD khusus admin
router.post('/', auth, rbac('admin'), uploadSingle, createArtikel)
router.put('/:id', auth, rbac('admin'), uploadSingle, updateArtikel)
router.delete('/:id', auth, rbac('admin'), deleteArtikel)

export default router
