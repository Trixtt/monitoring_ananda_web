import { afterEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { Op } from 'sequelize'
import {
  NILAI_DASAR_SIKAP,
  KATEGORI_SIKAP,
  PENGURANGAN_SIKAP,
  penguranganUntuk,
  hitungNilaiSikap
} from '../src/config/sikap.js'
import { sikapBulkSchema } from '../src/validators/index.js'
import { bisaAksesSiswa } from '../src/services/aksesKelas.js'
import { Sikap, Kehadiran, Siswa, TahunAjaran, User, sequelize } from '../src/models/index.js'
import { guruSikapBulk } from '../src/controllers/guruController.js'
import { ortuSikap } from '../src/controllers/ortuController.js'

const pemulih = []

function ganti(objek, nama, pengganti) {
  const asli = objek[nama]
  objek[nama] = pengganti
  pemulih.push(() => {
    objek[nama] = asli
  })
}

afterEach(() => {
  while (pemulih.length) pemulih.pop()()
})

function buatRes() {
  const res = { statusCode: 200, body: null }
  res.status = (kode) => {
    res.statusCode = kode
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

const wali = { id: 3, role: 'wali_kelas', kelasId: 2 }
const ganjil = { id: 9, nama: '2025/2026', semesterAktif: 'Ganjil' }

function siapkanTahunDanAkses(siswaRows) {
  ganti(TahunAjaran, 'findOne', async () => ganjil)
  ganti(Siswa, 'findAll', async () => siswaRows)
  ganti(User, 'findAll', async () => [])
  ganti(sequelize, 'transaction', async (callback) => callback({}))
}

describe('konfigurasi catatan sikap', () => {
  test('nilai dasar dan daftar kategori sesuai revisi v1.1', () => {
    assert.equal(NILAI_DASAR_SIKAP, 100)
    assert.deepEqual(KATEGORI_SIKAP, [
      'Bolos',
      'Tidak mengerjakan tugas',
      'Berkelahi dengan teman',
      'Memalak uang teman',
      'Membully teman/perundungan',
      'Berbicara kotor kepada teman',
      'Tidak sopan kepada guru',
      'Lainnya'
    ])
  })

  test('pengurangan teknis sementara per kategori', () => {
    assert.equal(PENGURANGAN_SIKAP.Bolos, 0)
    assert.equal(PENGURANGAN_SIKAP['Tidak mengerjakan tugas'], 5)
    assert.equal(PENGURANGAN_SIKAP['Berkelahi dengan teman'], 10)
    assert.equal(PENGURANGAN_SIKAP['Memalak uang teman'], 20)
    assert.equal(PENGURANGAN_SIKAP['Membully teman/perundungan'], 20)
    assert.equal(PENGURANGAN_SIKAP['Berbicara kotor kepada teman'], 5)
    assert.equal(PENGURANGAN_SIKAP['Tidak sopan kepada guru'], 10)
    assert.equal(PENGURANGAN_SIKAP.Lainnya, 5)
    assert.equal(penguranganUntuk('Kategori tidak dikenal'), 0)
  })

  test('hitungNilaiSikap memakai dasar 100 dan snapshot pengurangan', () => {
    assert.equal(hitungNilaiSikap([]), 100)
    assert.equal(hitungNilaiSikap([{ kategori: 'Tidak mengerjakan tugas', pengurangan: 5 }]), 95)
    assert.equal(
      hitungNilaiSikap([
        { kategori: 'Tidak mengerjakan tugas', pengurangan: 5 },
        { kategori: 'Berkelahi dengan teman', pengurangan: 10 }
      ]),
      85
    )
    assert.equal(hitungNilaiSikap(Array.from({ length: 6 }, () => ({ pengurangan: 20 }))), 0)
    assert.equal(hitungNilaiSikap([{ kategori: 'Bolos', pengurangan: 0 }]), 100)
    assert.equal(hitungNilaiSikap([{ kategori: 'Tidak mengerjakan tugas', pengurangan: 7 }]), 93)
  })

  test('aspek sosial dan spiritual tidak dibuat dua nilai sikap', () => {
    const catatan = [
      { kategori: 'Tidak mengerjakan tugas', jenis: 'sosial', pengurangan: 5 },
      { kategori: 'Tidak sopan kepada guru', jenis: 'spiritual', pengurangan: 10 }
    ]
    assert.equal(hitungNilaiSikap(catatan), 85)
  })
})

describe('validator sikapBulkSchema', () => {
  test('menerima kategori dan aspek yang dikenal', () => {
    const hasil = sikapBulkSchema.safeParse({
      daftar: [{ siswaId: 5, kategori: 'Tidak mengerjakan tugas', jenis: 'sosial', catatan: 'Tugas belum dikumpulkan', tanggal: '2025-10-15' }]
    })
    assert.equal(hasil.success, true)
    assert.equal(hasil.data.daftar[0].kategori, 'Tidak mengerjakan tugas')
  })

  test('kategori Lainnya wajib memiliki aspek dan keterangan', () => {
    const tanpaAspek = sikapBulkSchema.safeParse({
      daftar: [{ siswaId: 5, kategori: 'Lainnya', catatan: 'Perilaku lain' }]
    })
    assert.equal(tanpaAspek.success, false)
    assert.ok(tanpaAspek.error.issues.some((i) => i.path.includes('jenis')))

    const tanpaKeterangan = sikapBulkSchema.safeParse({
      daftar: [{ siswaId: 5, kategori: 'Lainnya', jenis: 'spiritual' }]
    })
    assert.equal(tanpaKeterangan.success, false)
    assert.ok(tanpaKeterangan.error.issues.some((i) => i.path.includes('catatan')))
  })

  test('kategori di luar daftar dan aspek selain sosial/spiritual ditolak', () => {
    const kategoriSalah = sikapBulkSchema.safeParse({
      daftar: [{ siswaId: 5, kategori: 'Nilai 3' }]
    })
    assert.equal(kategoriSalah.success, false)

    const aspekSalah = sikapBulkSchema.safeParse({
      daftar: [{ siswaId: 5, kategori: 'Berkelahi dengan teman', jenis: 'akademik' }]
    })
    assert.equal(aspekSalah.success, false)
  })

  test('minimal satu catatan wajib ada', () => {
    assert.equal(sikapBulkSchema.safeParse({ daftar: [] }).success, false)
  })
})

describe('akses wali kelas', () => {
  test('wali kelas hanya dapat mengakses siswa di kelasnya', () => {
    assert.equal(bisaAksesSiswa(wali, { id: 5, kelasId: 2 }), true)
    assert.equal(bisaAksesSiswa(wali, { id: 6, kelasId: 3 }), false)
  })

  test('guruSikapBulk menolak siswa di luar kelas', async () => {
    siapkanTahunDanAkses([{ id: 6, kelasId: 3 }])
    let dibuat = 0
    ganti(Sikap, 'create', async () => {
      dibuat++
      return { id: 1 }
    })

    const res = buatRes()
    await guruSikapBulk(
      {
        user: wali,
        body: { daftar: [{ siswaId: 6, kategori: 'Berkelahi dengan teman', jenis: 'sosial', tanggal: '2025-10-15' }] }
      },
      res
    )
    assert.equal(res.statusCode, 403)
    assert.match(res.body.message, /luar kelas/)
    assert.equal(dibuat, 0)
  })
})

describe('guruSikapBulk', () => {
  test('menyimpan kategori, aspek, pengurangan, dan guru yang membuat', async () => {
    siapkanTahunDanAkses([{ id: 5, kelasId: 2, nama: 'Siswa Uji' }])
    ganti(Sikap, 'findOne', async () => null)
    const dibuat = []
    ganti(Sikap, 'create', async (data) => {
      dibuat.push({ ...data, id: dibuat.length + 1 })
      return dibuat[dibuat.length - 1]
    })

    const res = buatRes()
    await guruSikapBulk(
      {
        user: wali,
        body: {
          daftar: [{
            siswaId: 5,
            kategori: 'Tidak mengerjakan tugas',
            jenis: 'sosial',
            catatan: 'Tugas belum dikumpulkan',
            tanggal: '2025-10-15'
          }]
        }
      },
      res
    )

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body, { message: '1 catatan sikap disimpan.', tersimpan: 1, duplikat: 0 })
    assert.equal(dibuat.length, 1)
    assert.equal(dibuat[0].siswaId, 5)
    assert.equal(dibuat[0].kategori, 'Tidak mengerjakan tugas')
    assert.equal(dibuat[0].jenis, 'sosial')
    assert.equal(dibuat[0].pengurangan, 5)
    assert.equal(dibuat[0].guruId, 3)
    assert.equal(dibuat[0].tahunAjaranId, 9)
    // Catatan non-Bolos tidak mengirim kehadiranId; database mengisi NULL.
    assert.ok(dibuat[0].kehadiranId == null)
  })

  test('pengiriman ulang request yang sama tidak menggandakan catatan', async () => {
    siapkanTahunDanAkses([{ id: 5, kelasId: 2, nama: 'Siswa Uji' }])
    let tersimpan = null
    ganti(Sikap, 'findOne', async () => tersimpan)
    const dibuat = []
    ganti(Sikap, 'create', async (data) => {
      tersimpan = { ...data, id: 1 }
      dibuat.push(tersimpan)
      return tersimpan
    })

    const req = {
      user: wali,
      body: {
        daftar: [{ siswaId: 5, kategori: 'Tidak sopan kepada guru', jenis: 'sosial', tanggal: '2025-10-15' }]
      }
    }
    const resPertama = buatRes()
    await guruSikapBulk(req, resPertama)
    const resKedua = buatRes()
    await guruSikapBulk(req, resKedua)

    assert.deepEqual(resPertama.body, { message: '1 catatan sikap disimpan.', tersimpan: 1, duplikat: 0 })
    assert.deepEqual(resKedua.body, {
      message: '0 catatan sikap disimpan. 1 catatan duplikat dilewati.',
      tersimpan: 0,
      duplikat: 1
    })
    assert.equal(dibuat.length, 1)
  })

  test('Bolos terhubung ke presensi alpa dan mengambil tahun ajaran dari presensi', async () => {
    siapkanTahunDanAkses([{ id: 5, kelasId: 2, nama: 'Siswa Uji' }])
    ganti(Kehadiran, 'findOne', async (opsi) => {
      assert.equal(opsi.where.siswaId, 5)
      assert.equal(opsi.where.status, 'alpa')
      assert.equal(opsi.where.tanggal, '2025-10-15')
      return { id: 77, siswaId: 5, tanggal: '2025-10-15', tahunAjaranId: 10, status: 'alpa' }
    })
    ganti(Sikap, 'findOne', async () => null)
    const dibuat = []
    ganti(Sikap, 'create', async (data) => {
      dibuat.push({ ...data, id: 1 })
      return dibuat[0]
    })

    const res = buatRes()
    await guruSikapBulk(
      {
        user: wali,
        body: { daftar: [{ siswaId: 5, kategori: 'Bolos', jenis: 'sosial', tanggal: '2025-10-15' }] }
      },
      res
    )

    assert.equal(res.statusCode, 200)
    assert.equal(dibuat.length, 1)
    assert.equal(dibuat[0].kehadiranId, 77)
    assert.equal(dibuat[0].tahunAjaranId, 10)
    assert.equal(dibuat[0].pengurangan, 0)
  })

  test('Bolos ditolak bila tidak ada presensi alpa yang cocok', async () => {
    siapkanTahunDanAkses([{ id: 5, kelasId: 2, nama: 'Siswa Uji' }])
    ganti(Kehadiran, 'findOne', async () => null)
    let dibuat = 0
    ganti(Sikap, 'create', async () => {
      dibuat++
      return { id: 1 }
    })

    const res = buatRes()
    await guruSikapBulk(
      {
        user: wali,
        body: { daftar: [{ siswaId: 5, kategori: 'Bolos', jenis: 'sosial', tanggal: '2025-10-15' }] }
      },
      res
    )

    assert.equal(res.statusCode, 400)
    assert.match(res.body.message, /presensi alpa/)
    assert.equal(dibuat, 0)
  })
})

describe('ortuSikap', () => {
  test('orang tua hanya membaca catatan siswa yang tertaut dan periode aktif', async () => {
    let opsiTerakhir = null
    ganti(TahunAjaran, 'findOne', async () => ganjil)
    ganti(Sikap, 'findAll', async (opsi) => {
      opsiTerakhir = opsi
      return [{
        id: 1,
        tanggal: '2025-10-15',
        jenis: 'sosial',
        kategori: 'Tidak mengerjakan tugas',
        catatan: 'Tugas belum dikumpulkan',
        pengurangan: 5
      }]
    })

    const res = buatRes()
    await ortuSikap({ user: { role: 'orang_tua', siswaId: 12 } }, res)

    assert.equal(opsiTerakhir.where.siswaId, 12)
    assert.equal(opsiTerakhir.where.tahunAjaranId, 9)
    assert.equal(opsiTerakhir.where.tanggal[Op.gte], '2025-07-14')
    assert.equal(opsiTerakhir.where.tanggal[Op.lte], '2025-12-21')
    assert.deepEqual(res.body.ringkas, { nilai: 95, jumlahCatatan: 1, tanpaCatatan: false })
    assert.deepEqual(res.body.list, [{
      id: 1,
      tanggal: '2025-10-15',
      kategori: 'Tidak mengerjakan tugas',
      aspek: 'sosial',
      keterangan: 'Tugas belum dikumpulkan'
    }])
  })

  test('akun orang tua tanpa siswa tertaut ditolak', async () => {
    const res = buatRes()
    await ortuSikap({ user: { role: 'orang_tua', siswaId: null } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(res.body.message, 'Akun belum tertaut siswa.')
  })
})
