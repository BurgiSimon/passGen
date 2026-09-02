# passGen

A password generator that runs entirely in your browser. Random characters or
EFF-wordlist passphrases, drawn from `crypto.getRandomValues`.

Nothing you generate is transmitted, logged, or written to storage. There is no
backend, no database and no analytics — the production server is a static file
server and nothing else. The session history lives in memory and dies with the tab.

- **Two modes** — random characters (configurable length, uppercase/digits/symbols)
  and passphrases from the EFF Short Wordlist #1.
- **Two skins** — `glass` (default, dark, animated) and `terminal` (brutalist
  monospace, with a light/dark/system toggle). Switch with the button in the top bar.
- **Keyboard driven**, works without a mouse, and respects `prefers-reduced-motion`.

---

## Self-hosting

The only thing you must decide up front is **`SITE_URL`**: the public origin you
will serve from. It is baked in at _build_ time, not read at runtime, because the
canonical link, the Open Graph/Twitter tags, the JSON-LD and the generated
`sitemap.xml` / `robots.txt` all need an absolute URL.

Get it wrong and the app still works perfectly — only link previews and search
engine canonicalisation point at the wrong host. Leave it unset and the build
warns and falls back to a `https://passgen.local` placeholder.

### Option 1 — Docker (recommended)

```bash
git clone https://github.com/BurgiSimon/passGen.git
cd passGen

docker build --build-arg SITE_URL=https://passwords.example.com -t passgen .
docker run -d --name passgen --restart unless-stopped -p 3000:80 passgen
```

Now on `http://localhost:3000`.

> The container listens on **port 80** internally (`EXPOSE 80`), so the mapping is
> `-p <host-port>:80`. Map it to whatever host port you like.

### Option 2 — Docker Compose

The `docker-compose.yml` in this repo is the author's own setup: it expects a
prebuilt image on an external `public_net` network fronted by a reverse proxy, so
`docker compose up` will not work as-is on a fresh clone. For self-hosting, use
this instead:

```yaml
services:
  passgen:
    build:
      context: .
      args:
        SITE_URL: https://passwords.example.com
    container_name: passgen
    restart: unless-stopped
    ports:
      - '3000:80'
```

```bash
docker compose up -d --build
```

### Option 3 — no Docker

Needs [Bun](https://bun.sh/) (or Node `^20.19.0 || >=22.12.0`).

```bash
git clone https://github.com/BurgiSimon/passGen.git
cd passGen
bun install

SITE_URL=https://passwords.example.com bun run build
PORT=3000 bun server.js
```

`server.js` serves `./dist`. Keep the two together if you copy the build elsewhere.

### Configuration

| Variable   | When       | Default                         | Purpose                                                     |
| ---------- | ---------- | ------------------------------- | ----------------------------------------------------------- |
| `SITE_URL` | build time | `https://passgen.local` (warns) | Absolute origin for canonical, `og:` tags, JSON-LD, sitemap |
| `PORT`     | run time   | `80`                            | Port `server.js` listens on                                 |

There is nothing else to configure. No secrets, no API keys, no database.

### Behind a reverse proxy

`server.js` deliberately stays minimal: it does **not** do TLS and does **not**
compress responses. Put it behind Caddy, nginx or Traefik and let that terminate
TLS and handle gzip/brotli — the JS bundle is ~100 KB raw and ~39 KB gzipped, so
enabling compression on the proxy is worth doing.

It does handle caching and status codes itself, so your proxy should not override:

- `/assets/*` — content-hashed, `Cache-Control: immutable` for a year
- `/index.html` — `no-cache`, so a deploy is picked up immediately
- everything else in `dist` — one hour
- unknown paths — a real **404**, not a 200 (the app has exactly one route)

---

## Development

```bash
bun install
bun run dev       # http://localhost:5173
```

| Command                   | Does                                  |
| ------------------------- | ------------------------------------- |
| `bun run dev`             | Dev server with HMR                   |
| `bun run build`           | Production build into `dist/`         |
| `bun run preview`         | Serve `dist/` with Vite (files only)  |
| `bun run format`          | Prettier over `src/`                  |
| `PORT=3000 bun server.js` | Serve `dist/` the way production does |

`bun run preview` is fine for a quick look, but only `server.js` applies the real
404 and `Cache-Control` behaviour.

### Tests

```bash
bun src/lib/passwordCore.check.mjs
```

Assert-based, no framework. Covers the generator, the character sets, the cookie
clamps, and the wordlist invariants.

### Regenerating icons and the social image

`public/og.png` and the PNG icons are generated from `public/lock.svg` and the
project's own fonts. They are committed; nothing at build or run time invokes this.

```bash
python3 scripts/gen-assets.py   # needs Pillow
```

## Project structure

```
passGen/
├── public/              # Static assets, icons, og.png, manifest
├── scripts/             # gen-assets.py (icon/social image generator)
├── src/
│   ├── components/      # UI + the vue-bits derived visual components
│   ├── composables/     # State, cookies, skin/theme, render-loop gating
│   ├── lib/             # passwordCore.js (pure logic) + wordlist + cookies
│   └── views/           # HomeView picks a skin: GlassView or TerminalView
├── server.js            # Production static server (Bun)
├── vite.config.js       # Build config + the SEO plugin that bakes in SITE_URL
└── Dockerfile           # Multi-stage Bun build
```

## Tech stack

Vue 3 (Composition API) · Vite · Tailwind CSS 4 · Bun · GSAP (dot-grid background only)

## Credits

- Wordlist: [EFF Short Wordlist #1](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases),
  CC BY 3.0 US.
- Several visual components are derived from [vue-bits](https://vue-bits.dev/).

## License

No `LICENSE` file has been added to this repository yet, so default copyright
applies. The EFF wordlist keeps its own CC BY 3.0 US terms regardless.
