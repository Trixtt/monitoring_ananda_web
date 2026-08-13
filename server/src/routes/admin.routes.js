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

const router = Router()

router.use(auth, rbac('admin'))

// Ringkasan
router.get('/ringkasan', ringkasanAdmin)

// Kelas
router.get('/kelas', listKelas)
router.post('/kelas', createKelas)
router.put('/kelas/:id', updateKelas)
router.delete('/kelas/:id', deleteKelas)

// Tahun ajaran
router.get('/tahun-ajaran', listTahunAjaran)
router.post('/tahun-ajaran', createTahunAjaran)
router.patch('/tahun-ajaran/:id/aktif', setAktifTahunAjaran)
router.delete('/tahun-ajaran/:id', deleteTahunAjaran)

// Mapel
router.get('/mapel', listMapel)
router.post('/mapel', createMapel)
router.put('/mapel/:id', updateMapel)
router.delete('/mapel/:id', deleteMapel)

// Siswa
router.get('/siswa', listSiswa)
router.post('/siswa', createSiswa)
router.get('/siswa/:id', detailSiswa)
router.put('/siswa/:id', updateSiswa)
router.delete('/siswa/:id', deleteSiswa)

// Akun
router.get('/akun', listAkun)
router.post('/akun', createAkun)
router.put('/akun/:id', updateAkun)
router.post('/akun/:id/reset-password', resetPassword)
router.get('/akun/opsi-siswa', listSiswaUntukAkun)

// SPK
router.get('/spk', getSpkSettings)
router.put('/spk', updateSpkSettings)

export default router
