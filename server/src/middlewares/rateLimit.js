function buatStore() {
  const map = new Map()
  const bersihkan = () => {
    const now = Date.now()
    for (const [k, v] of map) {
      if (v.resetAt <= now) map.delete(k)
    }
  }
  return {
    get: (key) => map.get(key),
    set: (key, entry) => {
      map.set(key, entry)
      if (map.size > 5000) bersihkan()
    }
  }
}

function keyUntuk(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function rateLimit({ windowMs = 60_000, max = 300, message = 'Terlalu banyak permintaan.' } = {}) {
  const store = buatStore()
  return (req, res, next) => {
    const key = keyUntuk(req)
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      const detik = Math.ceil((entry.resetAt - now) / 1000)
      const pesan = typeof message === 'function' ? message({ ...entry, detik }) : message
      return res.status(429).json({ message: pesan })
    }

    return next()
  }
}

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: ({ detik }) => {
    const menit = Math.ceil(detik / 60)
    return `Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`
  }
})

export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 600,
  message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.'
})