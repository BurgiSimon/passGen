# passGen

A sleek, web-based password generator built with Vue 3 and Vite. Generate secure passwords directly in your browser.

## Tech Stack

- **Frontend:** Vue 3 (Composition API) + Vite
- **Package Manager:** Bun
- **Deployment:** Docker & Docker Compose
- **Code Style:** Prettier

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js

### Installation

```bash
git clone https://github.com/BurgiSimon/passGen.git
cd passGen
bun install
```

### Development

```bash
bun dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Production Build

```bash
SITE_URL=https://your-domain.example bun run build
```

`SITE_URL` is the public origin the site is served from. The build bakes it into the canonical
link, the Open Graph / Twitter tags, the JSON-LD and the generated `sitemap.xml` and `robots.txt`.
Leave it unset and the build still succeeds, but it warns and falls back to a placeholder origin,
which means link previews and search-engine canonicalisation will point at the wrong host.

## Docker

Run the app in a container using Docker Compose:

```bash
docker compose up -d
```

Or build and run manually:

```bash
docker build --build-arg SITE_URL=https://your-domain.example -t passgen .
docker run -d -p 3000:3000 passgen
```

## Project Structure

```
passGen/
├── public/             # Static assets
├── src/                # Vue application source
├── server.js           # Production server
├── Dockerfile          # Container image definition
├── docker-compose.yml  # Docker Compose config
├── vite.config.js      # Vite configuration
└── index.html          # Entry HTML
```

## IDE Setup

[VS Code](https://code.visualstudio.com/) with the [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension is recommended.

## License

This project is open source.
