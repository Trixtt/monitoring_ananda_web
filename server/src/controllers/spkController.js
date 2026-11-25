import { SettingSpk } from '../models/index.js'

export async function getSpkSettings(req, res) {
  const setting = (await SettingSpk.findOne()) || (await SettingSpk.create({}))
  return res.json({ setting })
}

export async function updateSpkSettings(req, res) {
  let setting = await SettingSpk.findOne()
  if (!setting) setting = await SettingSpk.create({})

  const bobot = {
    bobotAkademik: req.body.bobotAkademik,
    bobotKehadiran: req.body.bobotKehadiran,
    bobotSikap: req.body.bobotSikap
  }
  for (const [k, v] of Object.entries(bobot)) {
    if (v !== undefined) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        return res.status(400).json({ message: `Bobot ${k} harus antara 0 dan 1.` })
      }
      setting[k] = n
    }
  }

  const totalBobot = Number(setting.bobotAkademik) + Number(setting.bobotKehadiran) + Number(setting.bobotSikap)
  if (Math.abs(totalBobot - 1) > 0.0001) {
    return res.status(400).json({ message: `Jumlah bobot harus 1. Saat ini ${totalBobot.toFixed(4)}.` })
  }

  const interval = {
    intervalBaikBawah: req.body.intervalBaikBawah,
    intervalPerhatianBawah: req.body.intervalPerhatianBawah,
    intervalBerisikoBawah: req.body.intervalBerisikoBawah
  }
  for (const [k, v] of Object.entries(interval)) {
    if (v !== undefined) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        return res.status(400).json({ message: `${k} harus antara 0 dan 1.` })
      }
      setting[k] = n
    }
  }
  if (!(setting.intervalBaikBawah > setting.intervalPerhatianBawah &&
        setting.intervalPerhatianBawah > setting.intervalBerisikoBawah)) {
    return res.status(400).json({ message: 'Interval harus berurutan: Baik > Perhatian > Berisiko.' })
  }

  const ambang = {
    ambangAkademik: req.body.ambangAkademik,
    ambangSikap: req.body.ambangSikap,
    ambangKehadiran: req.body.ambangKehadiran
  }
  for (const [k, v] of Object.entries(ambang)) {
    if (v !== undefined) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        return res.status(400).json({ message: `${k} harus antara 0 dan 1.` })
      }
      setting[k] = n
    }
  }

  const mapel = {
    kkmMapel: req.body.kkmMapel,
    ambangUnggul: req.body.ambangUnggul
  }
  for (const [k, v] of Object.entries(mapel)) {
    if (v !== undefined) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return res.status(400).json({ message: `${k} harus antara 0 dan 100.` })
      }
      setting[k] = n
    }
  }
  if (Number(setting.ambangUnggul) <= Number(setting.kkmMapel)) {
    return res.status(400).json({ message: 'Ambang unggul harus lebih besar dari KKM mapel.' })
  }

  await setting.save()
  return res.json({ message: 'Pengaturan SPK disimpan.', setting })
}

export async function spkPreview(req, res) {
  const setting = (await SettingSpk.findOne()) || (await SettingSpk.create({}))
  return res.json({ setting })
}
