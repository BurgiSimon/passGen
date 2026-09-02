import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// Canonical URL, og:url, og:image and the sitemap all need the absolute origin,
// which only the deployment knows. Set SITE_URL in the build environment
// (`SITE_URL=https://passgen.example bun run build`, or an ARG in the Dockerfile).
const SITE_URL = (process.env.SITE_URL || 'https://passgen.local').replace(/\/+$/, '')

const REPO = 'https://github.com/BurgiSimon/passGen'
const EFF = 'https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases'

// The three text files that cannot live in public/, because each one needs the
// absolute origin baked in. Built fresh per call so lastmod is the build date.
function seoFiles() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,

    // Single-route app, so the sitemap is the one canonical URL and nothing else.
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,

    // llmstxt.org: an H1, a blockquote summary, then linked sections. Assistants
    // that read this instead of executing the SPA still get an accurate answer.
    'llms.txt': `# PassGen

> Free password generator that runs entirely in the browser. Random characters or
> EFF Short Wordlist #1 passphrases, drawn from crypto.getRandomValues. Nothing a
> user generates is transmitted, logged, or written to storage.

PassGen is a single-page tool with one route and no accounts, no server-side state
and no network calls after load. The session history is held in memory and is gone
when the tab closes, by design.

## Modes

- [Random characters](${SITE_URL}/): Configurable length, with optional uppercase
  letters, digits and symbols. Lowercase is always included. There is deliberately
  no "at least one of each set" rule, because it would skew the output distribution.
- [Passphrase](${SITE_URL}/): Words from the EFF Short Wordlist #1, joined by a
  separator of the user's choice, for a secret that can be typed from memory.

## Resources

- [Source code](${REPO}): Vue 3 and Vite. MIT.
- [EFF Short Wordlist #1](${EFF}): The wordlist the passphrase mode draws from,
  CC BY 3.0 US.
`,
  }
}

// One place that knows the origin: substitutes %SITE_URL% into index.html, emits
// the text files at build, and serves the same bytes in dev. Without the dev half
// the SPA fallback answers /robots.txt with index.html, so anything auditing the
// dev server reads HTML as a robots file and reports it as malformed.
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
    configureServer(server) {
      const types = { '.txt': 'text/plain', '.xml': 'application/xml' }
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\//, '')
        const body = seoFiles()[name]
        if (!body) return next()
        res.setHeader('Content-Type', `${types[name.slice(name.lastIndexOf('.'))]}; charset=utf-8`)
        res.end(body)
      })
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(seoFiles())) {
        this.emitFile({ type: 'asset', fileName, source })
      }
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
