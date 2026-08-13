import { env } from '../config/env.js'

function normalisasiNomor(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  return digits
}

export async function kirimWhatsApp(phone, message) {
  if (!env.fonnteToken) {
    console.warn('[Fonnte] Token belum diatur, pesan tidak dikirim.')
    return { skipped: true, reason: 'no_token' }
  }
  if (!phone) {
    return { skipped: true, reason: 'no_phone' }
  }

  const target = normalisasiNomor(phone)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(env.fonnteUrl, {
      method: 'POST',
      headers: {
        Authorization: env.fonnteToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62'
      }),
      signal: controller.signal
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`[Fonnte] WA terkirim ke ${target}`)
      return { ok: true, data }
    }
    console.error(`[Fonnte] Gagal kirim ke ${target}:`, data?.reason || JSON.stringify(data))
    return { ok: false, data }
  } catch (err) {
    const alasan = err.name === 'AbortError' ? 'timeout 10 detik' : err.message
    console.error(`[Fonnte] Gagal mengirim WA ke ${target}:`, alasan)
    return { ok: false, error: alasan }
  } finally {
    clearTimeout(timer)
  }
}

export function formatPesanNilai(namaAnak, judul, mapel, nilai, link) {
  return `Halo Bapak/Ibu, nilai ${judul} Ananda ${namaAnak} pada mata pelajaran ${mapel} adalah ${nilai}. Silakan cek detail perkembangan Ananda di: ${link}`
}
