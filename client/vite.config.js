import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const ROBOTS = (siteUrl) => `User-agent: *
Allow: /
Disallow: /admin
Disallow: /guru
Disallow: /kepsek
Disallow: /orangtua
Disallow: /profile
Disallow: /ganti-password
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`

const SITEMAP = (siteUrl) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/artikel</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`

function siteFilesPlugin(siteUrl) {
  const robots = ROBOTS(siteUrl)
  const sitemap = SITEMAP(siteUrl)
  return {
    name: 'sdn4keling-site-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (path === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robots)
          return
        }
        if (path === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(sitemap)
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = String(env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')
  const apiOrigin = String(env.VITE_API_ORIGIN || '').replace(/\/+$/, '')
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5000'
  const isDev = mode === 'development'

  const connectSrc = ["'self'"]
  if (isDev) {
    connectSrc.push(devApiTarget)
    connectSrc.push(devApiTarget.replace(/^http/, 'ws'))
    connectSrc.push('ws://localhost:5173')
  } else if (apiOrigin) {
    connectSrc.push(apiOrigin)
    connectSrc.push(apiOrigin.replace(/^http/, 'ws'))
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  return {
    plugins: [
      vue(),
      {
        name: 'sdn4keling-html-env',
        transformIndexHtml(html) {
          return html
            .replaceAll('%SITE_URL%', siteUrl)
            .replaceAll('%CSP_CONTENT%', csp)
        }
      },
      siteFilesPlugin(siteUrl)
    ],
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: devApiTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: devApiTarget,
          changeOrigin: true,
          ws: true
        }
      }
    },
    build: {
      sourcemap: false
    }
  }
})
