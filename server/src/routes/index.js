import { Router } from 'express'
import { apiRateLimit } from '../middlewares/rateLimit.js'
import { csrfProtect } from '../middlewares/csrf.js'
import { sequelize } from '../models/index.js'
import authRoutes from './auth.routes.js'
import artikelRoutes from './artikel.routes.js'
import guruRoutes from './guru.routes.js'
import kepsekRoutes from './kepsek.routes.js'
import ortuRoutes from './ortu.routes.js'
import adminRoutes from './admin.routes.js'

const router = Router()

router.get('/health', async (req, res) => {
  const mulai = Date.now()
  try {
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ])
    return res.json({ ok: true, db: 'ok', latencyMs: Date.now() - mulai, uptime: Math.round(process.uptime()) })
  } catch {
    return res.status(503).json({ ok: false, db: 'error', message: 'Database tidak dapat diakses.' })
  }
})

router.use(apiRateLimit)
router.use(csrfProtect)
router.use('/auth', authRoutes)
router.use('/artikel', artikelRoutes)
router.use('/guru', guruRoutes)
router.use('/kepsek', kepsekRoutes)
router.use('/ortu', ortuRoutes)
router.use('/admin', adminRoutes)

export default router
