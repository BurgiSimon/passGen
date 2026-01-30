import { join } from 'path'

const PORT = 80
const DIST_DIR = './dist'

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
      const file = Bun.file(filePath)
      if (await file.exists()) {
        return new Response(file)
      }
    } catch {}

    // SPA fallback
    return new Response(Bun.file(join(DIST_DIR, 'index.html')))
  },
})

console.log(`Server running on port ${PORT}`)
