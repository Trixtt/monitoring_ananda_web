import crypto from 'node:crypto'

const PASSWORD_UMUM = new Set([
  'password',
  'passw0rd',
  'password1',
  'password123',
  'admin',
  'admin123',
  'admin1234',
  'qwerty',
  'qwerty123',
  '11111111',
  '12345678',
  '123456789',
  '1234567890',
  'iloveyou',
  'sekolah123',
  'sdn4keling'
])

export function validasiPasswordBaru(password, { username = '', name = '', tanggalLahir = null } = {}) {
  if (typeof password !== 'string') return 'Password wajib berupa teks.'
  if (password.length < 8) return 'Password minimal 8 karakter.'
  if (password.length > 200) return 'Password maksimal 200 karakter.'

  const kecil = password.toLowerCase()
  if (PASSWORD_UMUM.has(kecil)) {
    return 'Password terlalu umum. Gunakan kombinasi yang tidak mudah ditebak.'
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password harus mengandung huruf dan angka.'
  }
  if (username && username.length >= 3 && kecil.includes(String(username).toLowerCase())) {
    return 'Password tidak boleh mengandung username.'
  }
  if (name && name.length >= 4 && kecil.includes(String(name).toLowerCase().replace(/\s+/g, ''))) {
    return 'Password tidak boleh mengandung nama lengkap.'
  }
  if (tanggalLahir) {
    const digit = String(tanggalLahir).replace(/\D/g, '')
    if (digit.length === 8) {
      const ddmmYYYY = digit.slice(6, 8) + digit.slice(4, 6) + digit.slice(0, 4)
      if (kecil.includes(digit) || kecil.includes(ddmmYYYY)) {
        return 'Password tidak boleh berisi tanggal lahir.'
      }
    }
  }
  return null
}

export function buatPasswordSementara() {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const angka = '23456789'
  const pilih = (sumber) => sumber[crypto.randomInt(sumber.length)]

  const karakter = []
  for (let i = 0; i < 7; i += 1) karakter.push(pilih(huruf))
  for (let i = 0; i < 3; i += 1) karakter.push(pilih(angka))

  // Fisher-Yates dengan sumber acak kriptografis.
  for (let i = karakter.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1)
    ;[karakter[i], karakter[j]] = [karakter[j], karakter[i]]
  }

  return `T${karakter.join('')}`
}
