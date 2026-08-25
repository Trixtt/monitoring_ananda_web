import { Router } from 'express'
import {
  listKelas,
  createKelas,
  updateKelas,
  deleteKelas,
  listTahunAjaran,
  createTahunAjaran,
  setAktifTahunAjaran,
  deleteTahunAjaran,
  listMapel,
  createMapel,
  updateMapel,
  deleteMapel,
  listSiswa,
  detailSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
  ringkasanAdmin
} from '../controllers/masterController.js'
import {
  listAkun,
  createAkun,
  updateAkun,
  resetPassword,
  listSiswaUntukAkun
} from '../controllers/userController.js'
import { getSpkSettings, updateSpkSettings } from '../controllers/spkController.js'
import { auth, rbac } from '../middlewares/auth.js'
import {
  validate,
  kelasSchema,
  kelasUpdateSchema,
  tahunAjaranSchema,
  mapelSchema,
  mapelUpdateSchema,
  siswaSchema,
  siswaUpdateSchema,
  akunSchema,
  akunUpdateSchema,
  spkSchema
} from '../validators/index.js'

const router = Router()

router.use(auth, rbac('admin'))

// Ringkasan
router.get('/ringkasan', ringkasanAdmin)

// Kelas
router.get('/kelas', listKelas)
router.post('/kelas', validate(kelasSchema), createKelas)
router.put('/kelas/:id', validate(kelasUpdateSchema), updateKelas)
router.delete('/kelas/:id', deleteKelas)

// Tahun ajaran
router.get('/tahun-ajaran', listTahunAjaran)
router.post('/tahun-ajaran', validate(tahunAjaranSchema), createTahunAjaran)
router.patch('/tahun-ajaran/:id/aktif', setAktifTahunAjaran)
router.delete('/tahun-ajaran/:id', deleteTahunAjaran)

// Mapel
router.get('/mapel', listMapel)
router.post('/mapel', validate(mapelSchema), createMapel)
router.put('/mapel/:id', validate(mapelUpdateSchema), updateMapel)
router.delete('/mapel/:id', deleteMapel)

// Siswa
router.get('/siswa', listSiswa)
router.post('/siswa', validate(siswaSchema), createSiswa)
router.get('/siswa/:id', detailSiswa)
router.put('/siswa/:id', validate(siswaUpdateSchema), updateSiswa)
router.delete('/siswa/:id', deleteSiswa)

// Akun
router.get('/akun', listAkun)
router.post('/akun', validate(akunSchema), createAkun)
router.put('/akun/:id', validate(akunUpdateSchema), updateAkun)
router.post('/akun/:id/reset-password', resetPassword)
router.get('/akun/opsi-siswa', listSiswaUntukAkun)

// SPK
router.get('/spk', getSpkSettings)
router.put('/spk', validate(spkSchema), updateSpkSettings)

export default router
