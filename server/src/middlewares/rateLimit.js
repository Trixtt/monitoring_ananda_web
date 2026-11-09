function buatStore(maxKeys = 10_000) {
  const map = new Map()
  const bersihkan = () => {
    const now = Date.now()
    for (const [k, v] of map) {
      if (v.resetAt <= now) map.delete(k)
    }
  }
  const timer = globalThis.setInterval(bersihkan, 60_000)
  timer.unref?.()
  return {
    get: (key) => map.get(key),
    set: (key, entry) => {
      map.set(key, entry)
      if (map.size > maxKeys) bersihkan()
    }
  }
}

function keyUntuk(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function rateLimit({
  windowMs = 60_000,
  max = 300,
  message = 'Terlalu banyak permintaan.',
  keyGenerator = keyUntuk
} = {}) {
  const store = buatStore()
  return (req, res, next) => {
    const key = keyGenerator(req)
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
      res.set('Retry-After', String(detik))
      return res.status(429).json({ message: pesan })
    }

    return next()
  }
}

function usernameDari(req) {
  return String(req.body?.username || '').trim().toLowerCase().slice(0, 50)
}

function keyLogin(req) {
  return `${keyUntuk(req)}|${usernameDari(req)}`
}

function keyLoginIp(req) {
  return `ip|${keyUntuk(req)}`
}

function keyLoginAkun(req) {
  return `akun|${usernameDari(req)}`
}

const pesanLogin = ({ detik }) => {
  const menit = Math.max(1, Math.ceil(detik / 60))
  return `Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`
}

// Kombinasi IP + username: mencegah satu IP menebak satu akun berkali-kali.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: keyLogin,
  message: pesanLogin
})

// Per IP: mencegah satu IP mencoba banyak username (credential stuffing).
export const loginIpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyGenerator: keyLoginIp,
  message: pesanLogin
})

// Per akun: mencegah tebaran IP menyerang satu akun.
export const loginAkunRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: keyLoginAkun,
  message: pesanLogin
})

export const loginRateLimiters = [loginIpRateLimit, loginAkunRateLimit, loginRateLimit]

export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 600,
  message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.'
})

export const uploadRateLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'Terlalu banyak unggahan. Coba lagi sebentar lagi.'
})
