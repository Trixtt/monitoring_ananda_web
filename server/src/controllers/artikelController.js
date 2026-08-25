import { Op } from 'sequelize'
import { Artikel } from '../models/index.js'

const KATEGORI = ['Kegiatan', 'Pengumuman', 'Prestasi', 'Tips']

export async function listArtikel(req, res) {
  const { status, kategori, page = 1, q } = req.query
  const limit = 9
  const offset = (Number(page) - 1) * limit

  const where = {}
  if (status) where.status = status
  if (kategori) where.kategori = kategori
  if (q) where.judul = { [Op.like]: `%${q}%` }

  const { rows, count } = await Artikel.findAndCountAll({
    where,
    include: [{ association: 'author', attributes: ['id', 'name'] }],
    order: [['publishedAt', 'DESC']],
    limit,
    offset,
    distinct: true
  })

  return res.json({ list: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) })
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
    kategori: kategori || 'Kegiatan',
    isi,
    status: status === 'publish' ? 'publish' : 'draft',
    authorId: req.user.id,
    gambar: req.file ? `/uploads/${req.file.filename}` : null,
    publishedAt: status === 'publish' ? new Date() : null
  })

  return res.status(201).json({ message: 'Artikel berhasil disimpan.', item })
}

export async function updateArtikel(req, res) {
  const item = await Artikel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })

  const { judul, kategori, isi, status } = req.body
  if (judul !== undefined) item.judul = judul
  if (kategori !== undefined) item.kategori = kategori
  if (isi !== undefined) item.isi = isi
  if (req.file) item.gambar = `/uploads/${req.file.filename}`
  if (status !== undefined) {
    item.status = status
    if (status === 'publish' && !item.publishedAt) item.publishedAt = new Date()
  }
  await item.save()
  return res.json({ message: 'Artikel diperbarui.', item })
}

export async function deleteArtikel(req, res) {
  const item = await Artikel.findByPk(req.params.id)
  if (!item) return res.status(404).json({ message: 'Artikel tidak ditemukan.' })
  await item.destroy()
  return res.json({ message: 'Artikel dihapus.' })
}

export async function kategoriArtikel(req, res) {
  return res.json({ list: KATEGORI })
}
