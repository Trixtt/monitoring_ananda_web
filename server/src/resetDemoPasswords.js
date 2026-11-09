import bcrypt from 'bcryptjs'
import { initDb, sequelize, User } from './models/index.js'
import { Op } from 'sequelize'

// Menyelaraskan password akun demo yang SUDAH ADA agar cocok dengan
// dokumentasi (README / docs/demo-checklist.md). Skrip ini tidak membuat
// atau menghapus data, hanya memperbarui password akun demo yang dikenal.
//
// Pengamanan:
// - Menolak berjalan di produksi.
// - Menolak berjalan bila DEMO_MODE bukan 'true'.
// - Hanya menyentuh username demo yang eksplisit (admin, kepsek, wali1-6,
//   dan orang tua berpola 2025xxx).

const DEMO_PASSWORD = {
  admin: process.env.DEMO_ADMIN_PASSWORD || 'Admin#2026',
  kepsek: process.env.DEMO_KEPSEK_PASSWORD || 'Kepsek#2026',
  wali: process.env.DEMO_WALI_PASSWORD || 'Wali#2026',
  orangTua: process.env.DEMO_ORANGTUA_PASSWORD || 'Ortu#2026'
}

const waliUsernames = Array.from({ length: 6 }, (_, i) => `wali${i + 1}`)
const ortuPattern = /^2025\d{3}$/

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Skrip demo ditolak di produksi.')
  }
  if (process.env.DEMO_MODE !== 'true') {
    throw new Error('Set DEMO_MODE=true untuk menjalankan skrip demo ini.')
  }

  await initDb()

  const rencana = [
    { usernames: ['admin'], password: DEMO_PASSWORD.admin },
    { usernames: ['kepsek'], password: DEMO_PASSWORD.kepsek },
    { usernames: waliUsernames, password: DEMO_PASSWORD.wali }
  ]

  let total = 0
  for (const { usernames, password } of rencana) {
    const hash = bcrypt.hashSync(password, 10)
    const [jumlah] = await User.update(
      { password: hash, mustChangePassword: false },
      { where: { username: { [Op.in]: usernames } } }
    )
    total += jumlah
    console.log(`  ${usernames.join(', ')} -> ${jumlah} akun`)
  }

  const orangTua = await User.findAll({ where: { role: 'orang_tua' }, attributes: ['id', 'username'] })
  const targetOrtu = orangTua.filter((u) => ortuPattern.test(u.username))
  if (targetOrtu.length) {
    const hash = bcrypt.hashSync(DEMO_PASSWORD.orangTua, 10)
    const [jumlah] = await User.update(
      { password: hash, mustChangePassword: false },
      { where: { id: { [Op.in]: targetOrtu.map((u) => u.id) } } }
    )
    total += jumlah
    console.log(`  orang tua (2025xxx) -> ${jumlah} akun`)
  }

  console.log(`Selesai. ${total} akun demo diselaraskan.`)
  console.log('Password demo:')
  console.log(`  admin / ${DEMO_PASSWORD.admin}`)
  console.log(`  kepsek / ${DEMO_PASSWORD.kepsek}`)
  console.log(`  wali1-6 / ${DEMO_PASSWORD.wali}`)
  console.log(`  2025001 dst / ${DEMO_PASSWORD.orangTua}`)

  await sequelize.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
