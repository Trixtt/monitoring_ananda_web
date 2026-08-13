const attempts = new Map()

export function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  const windowMs = 15 * 60 * 1000
  const max = 5

  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs })
    return next()
  }

  if (entry.count >= max) {
    const menit = Math.ceil((entry.resetAt - now) / 60000)
    return res.status(429).json({
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`
    })
  }

  entry.count += 1
  return next()
}
