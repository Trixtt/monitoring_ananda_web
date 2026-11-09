const SITE_NAME = 'SD Negeri 4 Keling'
const DEFAULT_TITLE = `Sistem Monitoring Perkembangan Siswa - ${SITE_NAME}`
const DEFAULT_DESCRIPTION =
  'Sistem monitoring perkembangan siswa SD Negeri 4 Keling. Pantau nilai akademik, kehadiran, dan sikap putra-putri Anda.'

export const SITE_URL = String(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, '')

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(attrs.property ? 'meta' : 'meta')
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value)
  }
  return el
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Perbarui metadata SEO untuk halaman saat ini.
 * @param {object} opsi
 * @param {string} [opsi.title]
 * @param {string} [opsi.description]
 * @param {string} [opsi.path] path relatif, mis. "/artikel/1"
 * @param {string} [opsi.image] URL absolut atau path gambar
 * @param {boolean} [opsi.noindex]
 * @param {object|null} [opsi.jsonLd]
 */
export function setSeo({ title, description, path = '/', image, noindex = false, jsonLd = null } = {}) {
  const judul = title || DEFAULT_TITLE
  const deskripsi = description || DEFAULT_DESCRIPTION
  const url = absoluteUrl(path)
  const gambar = image ? absoluteUrl(image) : absoluteUrl('/og-image.png')

  if (document.title !== judul) document.title = judul

  upsertMeta('meta[name="description"]', { name: 'description', content: deskripsi })
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: noindex ? 'noindex, nofollow' : 'index, follow'
  })

  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: judul })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: deskripsi })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: gambar })

  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: judul })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: deskripsi })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: gambar })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })

  upsertLink('canonical', url)
  upsertJsonLd('jsonld-page', jsonLd)
}
