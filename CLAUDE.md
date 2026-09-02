# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PassGen is a password generator web app built with Vue 3 (Composition API), Vite, and Tailwind CSS 4. The UI is terminal/brutalist: monospace, zero border-radius, hairline borders, one accent colour (`#27FF64`) used only to signal state.

## Commands

```bash
bun run dev       # Start dev server (localhost:5173)
bun run build     # Production build to /dist
bun run preview   # Preview production build
bun run format    # Format with Prettier
```

Docker: `docker compose up -d` (serves on port 3000)

## Architecture

- **Entry:** `index.html` → `src/main.js` → Vue app with Router
- **Single route** (`/`) renders `HomeView.vue`, which is the only place `usePasswordGen()` is called; it passes state down as props and `v-model`s. No store, no provide/inject.
- **`src/lib/passwordCore.js`** — pure generation logic. No Vue, no DOM. Character sets, CSPRNG with rejection sampling, `generate()`, `clampLength()`. Assertable by a plain script.
- **`src/composables/usePasswordGen.js`** — Vue state, cookie persistence, clipboard, haptics, global keyboard shortcuts.
- **`src/components/PasswordOutput.vue`** — password hero, copy/generate buttons, and the glyph-cascade reveal animation (one self-terminating rAF loop, no library).
- **`src/components/PasswordControls.vue`** — native `<input type=range>` and four native checkboxes styled as `[x]` / `[ ]`.

### Behavior that must not drift

- Lowercase is always included and is not a toggle. There is deliberately **no** "at least one of each set" guarantee — adding one would change the output distribution.
- Passwords come from `crypto.getRandomValues` only. `Math.random()` is for the reveal animation and must never touch a password.
- Cookie keys `pg_uppercase`, `pg_numbers`, `pg_special`, `pg_noNumFirstLast`, `pg_length` — 365 days, `SameSite=Lax`. `pg_length` is user-editable input and is clamped on read.
- Controls must stay **native** form elements. The global keydown handler skips shortcuts when the focused element is `INPUT`/`TEXTAREA`/`SELECT`; a `<button role="switch">` would make Space both toggle and regenerate.
- Shortcuts ignore `ctrl`/`meta`/`alt` so `Ctrl+C` is not hijacked.

## Testing

```bash
bun src/lib/passwordCore.check.mjs   # assert-based, no framework
```

## Key Conventions

- All components use `<script setup>` with Composition API
- Props defined with TypeScript interfaces via `withDefaults(defineProps<...>())`
- Styling: design tokens in `src/style.css` (`--bg`, `--surface`, `--fg`, `--fg-dim`, `--border`, `--accent`, `--font-mono`, `--step`), consumed as `var(...)` in scoped CSS. Accent is `#27FF64`.
- Monospace throughout via the native `ui-monospace` stack — no webfont, no `@font-face`
- Zero `border-radius`. Never remove the global `:focus-visible` outline
- Formatting: no semicolons, single quotes, 100 char print width (see `.prettierrc.json`)
- Path alias: `@/` maps to `./src/`

## Production

`server.js` is a Bun HTTP server that serves `/dist` with SPA fallback. The Dockerfile uses multi-stage Bun builds.
