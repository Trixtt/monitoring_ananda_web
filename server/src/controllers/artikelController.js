import fs from 'node:fs'
import path from 'node:path'
import { Op } from 'sequelize'
import { Artikel } from '../models/index.js'
import { env } from '../config/env.js'
import { catatAudit } from '../services/audit.js'

const KATEGORI = ['Kegiatan', 'Pengumuman', 'Prestasi', 'Tips']
const STATUS = ['draft', 'publish']

function batasiAngka(nilai, bawaan, min, max) {
  const n = Number(nilai)
  if (!Number.isFinite(n)) return bawaan
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function hapusGambarLokal(gambar) {
  if (!gambar || !gambar.startsWith('/uploads/')) return
  const nama = path.basename(gambar)
  const file = path.join(env.uploadDir, nama)
  fs.promises.unlink(file).catch(() => {})
}

export async function listArtikel(req, res) {
  const isAdmin = req.user?.role === 'admin'
  const { status, kategori, q } = req.query
  const page = batasiAngka(req.query.page, 1, 1, 10000)
  const limit = batasiAngka(req.query.limit, 9, 1, isAdmin ? 100 : 24)
  const offset = (page - 1) * limit

  const where = {}
  if (isAdmin && status && STATUS.includes(status)) {
    where.status = status
  } else {
    where.status = 'publish'
  }
  if (kategori && KATEGORI.includes(kategori)) where.kategori = kategori
  if (q) where.judul = { [Op.like]: `%${String(q).slice(0, 100)}%` }

  const { rows, count } = await Artikel.findAndCountAll({
    where,
    include: [{ association: 'author', attributes: ['id', 'name'] }],
    order: [
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset,
    distinct: true
  })

  return res.json({ list: rows, total: count, page, pages: Math.ceil(count / limit) })
}

export async function detailArtikel(req, res) {
  const item = await Artikel.findByPk(req.params.id, {
    include: [{ association: 'author', attributes: ['id', 'name'] }]
  })
  if (!item) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })

  if (item.status !== 'publish' && req.user?.role !== 'admin') {
    return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
  }

  return res.json({ artikel: item })
}

export async function createArtikel(req, res) {
  const { judul, kategori, isi, status } = req.body
  if (!judul || !isi) {
    return res.status(400).json({ message: 'Judul dan isi artikel wajib diisi.' })
  }

  const item = await Artikel.create({
    judul,
    kategori: KATEGORI.includes(kategori) ? kategori : 'Kegiatan',
    isi,
    status: status === 'publish' ? 'publish' : 'draft',
    authorId: req.user.id,
    gambar: req.file ? `/uploads/${req.file.filename}` : null,
    publishedAt: status === 'publish' ? new Date() : null
  })

  await catatAudit({ req, action: 'artikel.dibuat', entity: 'artikel', entityId: item.id })

  return res.status(201).json({ message: 'Artikel berhasil disimpan.', item })
}

export async function updateArtikel(req, res) {
  const item = await Artikel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })

  const { judul, kategori, isi, status } = req.body
  if (judul !== undefined) item.judul = judul
  if (kategori !== undefined && KATEGORI.includes(kategori)) item.kategori = kategori
  if (isi !== undefined) item.isi = isi
  if (req.file) {
    const lama = item.gambar
    item.gambar = `/uploads/${req.file.filename}`
    hapusGambarLokal(lama)
  }
  if (status !== undefined) {
    if (!STATUS.includes(status)) return res.status(400).json({ message: 'Status artikel tidak valid.' })
    item.status = status
    if (status === 'publish') {
      if (!item.publishedAt) item.publishedAt = new Date()
    } else {
      item.publishedAt = null
    }
  }
  await item.save()

  await catatAudit({ req, action: 'artikel.diperbarui', entity: 'artikel', entityId: item.id })

  return res.json({ message: 'Artikel diperbarui.', item })
}

export async function deleteArtikel(req, res) {
  const item = await Artikel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
  const gambar = item.gambar
  await item.destroy()
  hapusGambarLokal(gambar)
  await catatAudit({
    req,
    action: 'artikel.dihapus',
    entity: 'artikel',
    entityId: req.params.id,
    detail: { judul: item.judul }
  })
  return res.json({ message: 'Artikel dihapus.' })
}

export async function kategoriArtikel(req, res) {
  return res.json({ list: KATEGORI })
}
