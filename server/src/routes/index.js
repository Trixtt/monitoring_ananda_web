import { Router } from 'express'
import authRoutes from './auth.routes.js'
import artikelRoutes from './artikel.routes.js'
import guruRoutes from './guru.routes.js'
import kepsekRoutes from './kepsek.routes.js'
import ortuRoutes from './ortu.routes.js'
import adminRoutes from './admin.routes.js'

const router = Router()

router.get('/health', (req, res) => res.json({ ok: true }))
router.use('/auth', authRoutes)
router.use('/artikel', artikelRoutes)
router.use('/guru', guruRoutes)
router.use('/kepsek', kepsekRoutes)
router.use('/ortu', ortuRoutes)
router.use('/admin', adminRoutes)

export default router
