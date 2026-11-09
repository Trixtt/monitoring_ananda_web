import { Op } from 'sequelize'
import { Siswa } from '../models/index.js'

export function bisaAksesSiswa(user, siswa) {
  if (!user || !siswa) return false
  if (user.role === 'admin') return true

  const kelasUser = Number(user.kelasId || 0)
  const kelasSiswa = Number(siswa.kelasId || 0)
  return kelasUser > 0 && kelasUser === kelasSiswa
}

export async function cariSiswaTerakses(user, siswaId, options = {}) {
  const siswa = await Siswa.findByPk(siswaId, options)
  if (!siswa) return { status: 404, message: 'Siswa tidak ditemukan.' }
  if (!bisaAksesSiswa(user, siswa)) {
    return { status: 403, message: 'Siswa di luar kelas Anda.' }
  }
  return { siswa }
}

export async function validasiSiswaDalamKelas(user, siswaIds) {
  const unik = [...new Set(siswaIds.map(Number).filter(Boolean))]
  if (!unik.length) return { rows: [] }

  const rows = await Siswa.findAll({
    where: { id: { [Op.in]: unik } },
    attributes: ['id', 'kelasId']
  })
  if (rows.length !== unik.length) {
    return { status: 404, message: 'Ada siswa yang tidak ditemukan.' }
  }

  if (user.role !== 'admin' && rows.some((siswa) => !bisaAksesSiswa(user, siswa))) {
    return { status: 403, message: 'Ada siswa di luar kelas Anda.' }
  }

  return { rows }
}
