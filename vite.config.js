import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// Canonical URL, og:url, og:image and the sitemap all need the absolute origin,
// which only the deployment knows. Set SITE_URL in the build environment
// (`SITE_URL=https://passgen.example bun run build`, or an ARG in the Dockerfile).
const SITE_URL = (process.env.SITE_URL || 'https://passgen.local').replace(/\/+$/, '')

// One place that knows the origin: substitutes %SITE_URL% into index.html and
// emits robots.txt + sitemap.xml, which cannot live in public/ because they
// need that same absolute URL baked in.
function seo() {
  return {
    name: 'passgen-seo',
    buildStart() {
      if (!process.env.SITE_URL) {
        this.warn(`SITE_URL is unset — canonical, og:image and sitemap will point at ${SITE_URL}`)
      }
    },
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', SITE_URL)
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        // Single-route app, so the sitemap is the one canonical URL and nothing else.
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss(), seo()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
