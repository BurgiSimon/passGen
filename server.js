import { join, resolve } from 'path'

// 80 in the container; override locally, where binding 80 needs root.
const PORT = Number(process.env.PORT) || 80
const DIST_DIR = './dist'
const DIST_ROOT = resolve(DIST_DIR)

const cacheControl = (pathname) => {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (pathname === '/index.html') return 'no-cache'
  return 'public, max-age=3600'
}

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url)
    let pathname = url.pathname

    if (pathname === '/') {
      pathname = '/index.html'
    }

    const filePath = join(DIST_DIR, pathname)

    try {
      const resolved = resolve(filePath)
      if (resolved === DIST_ROOT || resolved.startsWith(DIST_ROOT + '/')) {
        const file = Bun.file(filePath)
        if (await file.exists()) {
          return new Response(file, { headers: { 'Cache-Control': cacheControl(pathname) } })
        }
      }
    } catch {}

    // Single-route app: unknown paths are not pages, so say so.
    return new Response(Bun.file(join(DIST_DIR, 'index.html')), {
      status: 404,
      headers: { 'Cache-Control': 'no-cache' },
    })
  },
})

console.log(`Server running on port ${PORT}`)
