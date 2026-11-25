import { z } from 'zod'

const tanggal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
const idInt = z.coerce.number().int('Harus berupa angka bulat')

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const hasil = schema.safeParse(req[source])
    if (!hasil.success) {
      const issue = hasil.error.issues[0]
      const path = issue.path.join('.')
      return res.status(400).json({ message: path ? `${path}: ${issue.message}` : issue.message })
    }
    req[source] = hasil.data
    return next()
  }
}

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(50),
  password: z.string().min(1, 'Password wajib diisi').max(200)
})

export const changePasswordSchema = z
  .object({
    passwordLama: z.string().min(1, 'Password lama wajib diisi').max(200),
    passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter').max(200),
    konfirmasi: z.string().min(1, 'Konfirmasi password wajib diisi')
  })
  .refine((d) => d.passwordBaru === d.konfirmasi, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasi']
  })

export const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(150).optional(),
  email: z.string().max(150).optional(),
  phone: z.string().max(25).optional()
})

export const kelasSchema = z.object({
  nama: z.string().min(1, 'Nama kelas wajib diisi').max(100),
  tingkat: z.coerce.number().int().min(1, 'Tingkat minimal 1').max(6, 'Tingkat maksimal 6'),
  waliKelas: z.string().max(150).nullable().optional()
})
export const kelasUpdateSchema = kelasSchema.partial()

const rentangSemesterValid = (d) => {
  for (const [mulaiKey, akhirKey] of [
    ['ganjilMulai', 'ganjilAkhir'],
    ['genapMulai', 'genapAkhir']
  ]) {
    const mulai = d[mulaiKey]
    const akhir = d[akhirKey]
    if ((mulai == null) !== (akhir == null)) return false
    if (mulai && akhir && String(mulai) > String(akhir)) return false
  }
  return true
}

const fieldSemester = {
  semesterAktif: z.enum(['Ganjil', 'Genap']).optional(),
  ganjilMulai: tanggal.nullable().optional(),
  ganjilAkhir: tanggal.nullable().optional(),
  genapMulai: tanggal.nullable().optional(),
  genapAkhir: tanggal.nullable().optional()
}

export const tahunAjaranSchema = z
  .object({ nama: z.string().min(1, 'Nama tahun ajaran wajib diisi').max(20), ...fieldSemester })
  .refine(rentangSemesterValid, {
    message: 'Tanggal mulai dan akhir semester harus berpasangan dan berurutan.'
  })

export const tahunAjaranUpdateSchema = z
  .object({ nama: z.string().min(1, 'Nama tahun ajaran wajib diisi').max(20).optional(), ...fieldSemester })
  .refine(rentangSemesterValid, {
    message: 'Tanggal mulai dan akhir semester harus berpasangan dan berurutan.'
  })

export const mapelSchema = z.object({
  nama: z.string().min(1, 'Nama mata pelajaran wajib diisi').max(150)
})
export const mapelUpdateSchema = mapelSchema.partial()

export const siswaSchema = z.object({
  nisn: z.string().min(1, 'NISN wajib diisi').max(20),
  nama: z.string().min(1, 'Nama siswa wajib diisi').max(150),
  jenisKelamin: z.enum(['L', 'P']).nullable().optional(),
  tanggalLahir: tanggal.nullable().optional(),
  tahunAngkatan: idInt.nullable().optional(),
  nomorAbsen: idInt.nullable().optional(),
  kelasId: idInt.nullable().optional(),
  statusABK: z.boolean().optional(),
  catatanABK: z.string().nullable().optional()
})
export const siswaUpdateSchema = siswaSchema.partial()

export const akunSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50)
    .regex(/^[\w.-]+$/, 'Username hanya boleh huruf, angka, titik, dan garis bawah'),
  password: z.string().max(200).optional(),
  name: z.string().min(1, 'Nama wajib diisi').max(150),
  role: z.enum(['admin', 'kepala_sekolah', 'wali_kelas', 'orang_tua'], {
    message: 'Role tidak valid'
  }),
  phone: z.string().max(25).nullable().optional(),
  email: z.string().max(150).nullable().optional(),
  kelasId: idInt.nullable().optional(),
  siswaId: idInt.nullable().optional(),
  mustChangePassword: z.boolean().optional()
})
export const akunUpdateSchema = akunSchema.partial().extend({
  active: z.boolean().optional()
})

export const spkSchema = z
  .object({
    bobotAkademik: z.coerce.number().min(0).max(1),
    bobotKehadiran: z.coerce.number().min(0).max(1),
    bobotSikap: z.coerce.number().min(0).max(1),
    intervalBaikBawah: z.coerce.number().min(0).max(1),
    intervalPerhatianBawah: z.coerce.number().min(0).max(1),
    intervalBerisikoBawah: z.coerce.number().min(0).max(1),
    ambangAkademik: z.coerce.number().min(0).max(1),
    ambangSikap: z.coerce.number().min(0).max(1),
    ambangKehadiran: z.coerce.number().min(0).max(1),
    kkmMapel: z.coerce.number().min(0).max(100),
    ambangUnggul: z.coerce.number().min(0).max(100)
  })
  .partial()
  .refine((d) => {
    const keys = ['bobotAkademik', 'bobotKehadiran', 'bobotSikap']
    if (!keys.every((k) => d[k] !== undefined)) return true
    const total = keys.reduce((a, k) => a + Number(d[k]), 0)
    return Math.abs(total - 1) < 0.0001
  }, { message: 'Jumlah bobot harus 1.' })
  .refine((d) => {
    const keys = ['intervalBaikBawah', 'intervalPerhatianBawah', 'intervalBerisikoBawah']
    if (!keys.every((k) => d[k] !== undefined)) return true
    return d.intervalBaikBawah > d.intervalPerhatianBawah && d.intervalPerhatianBawah > d.intervalBerisikoBawah
  }, { message: 'Interval harus berurutan: Baik > Perhatian > Berisiko.' })
  .refine((d) => {
    if (d.kkmMapel === undefined || d.ambangUnggul === undefined) return true
    return Number(d.ambangUnggul) > Number(d.kkmMapel)
  }, { message: 'Ambang unggul harus lebih besar dari KKM mapel.' })

export const nilaiSchema = z.object({
  siswaId: idInt,
  mapelId: idInt,
  judul: z.string().min(1, 'Judul penilaian wajib diisi').max(150),
  nilai: z.coerce.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
  tanggal: tanggal.optional()
})

export const kehadiranBulkSchema = z.object({
  tanggal,
  daftar: z.array(
    z.object({
      siswaId: idInt,
      status: z.enum(['hadir', 'izin', 'sakit', 'alpa'], { message: 'Status kehadiran tidak valid' }),
      keterangan: z.string().max(255).nullable().optional()
    })
  )
})

export const sikapBulkSchema = z.object({
  daftar: z.array(
    z.object({
      siswaId: idInt,
      jenis: z.enum(['spiritual', 'sosial']).default('spiritual'),
      nilai: z.coerce.number().int().min(1, 'Nilai sikap 1-5').max(5, 'Nilai sikap 1-5'),
      catatan: z.string().max(1000).nullable().optional(),
      tanggal: tanggal.optional()
    })
  )
})

export const abkSchema = z.object({
  statusABK: z.boolean().optional(),
  catatanABK: z.string().max(1000).nullable().optional()
})

export const laporanSchema = z.object({
  judul: z.string().max(200).optional(),
  kelasId: idInt.nullable().optional(),
  kategori: z.string().max(50).optional(),
  tanggalMulai: tanggal.nullable().optional(),
  tanggalAkhir: tanggal.nullable().optional()
})

export const artikelSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi').max(200),
  kategori: z.enum(['Prestasi', 'Kegiatan', 'Pengumuman', 'Tips']).optional(),
  isi: z.string().min(1, 'Isi artikel wajib diisi'),
  status: z.enum(['draft', 'publish']).optional()
})
export const artikelUpdateSchema = artikelSchema.partial()
