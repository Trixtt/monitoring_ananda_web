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
    passwordLama: z.string().max(200).optional(),
    passwordBaru: z.string().min(6, 'Password baru minimal 6 karakter').max(200),
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

export const tahunAjaranSchema = z.object({
  nama: z.string().min(1, 'Nama tahun ajaran wajib diisi').max(20)
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
  password: z.string().min(6, 'Password minimal 6 karakter').max(200),
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
    intervalBerisikoBawah: z.coerce.number().min(0).max(1)
  })
  .partial()

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
      nilai: z.coerce.number().int().min(1, 'Nilai sikap 1-4').max(4, 'Nilai sikap 1-4'),
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
  kategori: z.enum(['Prestasi', 'Kegiatan', 'Pengumuman']).optional(),
  isi: z.string().min(1, 'Isi artikel wajib diisi'),
  status: z.enum(['draft', 'publish']).optional()
})
export const artikelUpdateSchema = artikelSchema.partial()
