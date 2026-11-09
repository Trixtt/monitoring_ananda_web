import { AuditLog } from '../models/index.js'

function ringkasDetail(detail) {
  if (detail === undefined || detail === null) return null
  try {
    const teks = typeof detail === 'string' ? detail : JSON.stringify(detail)
    return teks.length > 4000 ? `${teks.slice(0, 4000)}…` : teks
  } catch {
    return null
  }
}

// Audit bersifat best-effort: kegagalan menulis audit tidak boleh
// menggagalkan operasi utama, tetapi tetap dicatat di log server.
export async function catatAudit({ req = null, action, entity = null, entityId = null, detail = null, actor = null }) {
  try {
    const user = actor || req?.user || null
    await AuditLog.create({
      actorId: user?.id || null,
      actorName: user?.username || user?.name || null,
      action,
      entity,
      entityId: entityId === null || entityId === undefined ? null : String(entityId),
      detail: ringkasDetail(detail),
      ip: req?.ip || req?.socket?.remoteAddress || null,
      userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 255) || null
    })
  } catch (e) {
    console.warn(`[Audit] Gagal menulis audit "${action}":`, e.message)
  }
}
