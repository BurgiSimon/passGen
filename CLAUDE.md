# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PassGen is a password generator web app built with Vue 3 (Composition API), Vite, and Tailwind CSS 4. Two modes — random characters and EFF-wordlist passphrases — with an entropy meter, a session-only history, and a light/dark/system theme. The UI is terminal/brutalist: monospace, zero border-radius, hairline borders, one accent colour used only to signal state.

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
- **`src/lib/passwordCore.js`** — pure generation logic. No Vue, no DOM. Character sets, CSPRNG with rejection sampling, `generate()`, `generatePassphrase()`, `entropyBits()`, and the `clamp*` cookie guards. Assertable by a plain script.
- **`src/lib/wordlist.js`** — EFF Short Wordlist #1, CC BY 3.0 US. 1295 words (see the file header for the one deliberate omission).
- **`src/lib/cookies.js`** — cookie read/write plus `getBool`/`getEnum` validators.
- **`src/composables/usePasswordGen.js`** — Vue state, cookie persistence, clipboard, haptics, history, global keyboard shortcuts.
- **`src/composables/useTheme.js`** — `system` / `dark` / `light`, persisted in `pg_theme`.
- **`src/components/PasswordOutput.vue`** — password hero, entropy meter, copy/generate buttons, and the glyph-cascade reveal animation (one self-terminating rAF loop, no library).
- **`src/components/PasswordControls.vue`** — mode switch, native `<input type=range>`, native radios and checkboxes styled as `[x]` / `[ ]`.
- **`src/components/PasswordHistory.vue`** — the session history list.
- **`src/components/AnimatedList.vue`** — vue-bits AnimatedList, ported and restyled. Depends on `motion-v`. Deviations from upstream are commented in the file: a scoped slot (upstream hardcodes a `<p>`, which cannot hold a button), no Tab hijacking, reduced-motion support, and gradients that recompute when the item count changes rather than only on scroll.

### Behavior that must not drift

- Lowercase is always included and is not a toggle. There is deliberately **no** "at least one of each set" guarantee — adding one would change the output distribution.
- Passwords come from `crypto.getRandomValues` only. `Math.random()` is for the reveal animation and must never touch a password.
- Cookie keys `pg_uppercase`, `pg_numbers`, `pg_special`, `pg_noNumFirstLast`, `pg_length` — 365 days, `SameSite=Lax`. `pg_length` is user-editable input and is clamped on read.
- Controls must stay **native** form elements, so they keep their own keyboard behaviour.
- The global keydown handler bails out whenever the event target is inside any interactive element (`button, a[href], input, textarea, select, [role=button]`). Narrowing that back to tag names would `preventDefault()` Enter and Space on focused buttons, making every button tabbable but not operable.
- Shortcuts ignore `ctrl`/`meta`/`alt` so `Ctrl+C` is not hijacked.
- **History is in-memory only and must stay that way.** Writing generated passwords to a cookie, `localStorage`, or `sessionStorage` would leave plaintext secrets readable by any script on the origin. The list dies with the tab, and the UI says so.
- `entropyBits()` describes the *generator*, not the string it produced. Capitalising every word is deterministic, so it adds 0 bits — do not "fix" that to look better.
- No word in `wordlist.js` may contain a separator, or a phrase becomes ambiguous to read back. The check script asserts this.
- Theming is `light-dark()` against `color-scheme`; `[data-theme]` only sets `color-scheme`. There is no duplicated palette and no `prefers-color-scheme` media query — do not reintroduce one. `light-dark()` takes colours only, so a non-colour token (an opacity, a length) cannot use it.
- A small inline script in `index.html` pins the saved theme before first paint; without it a light-theme user gets a dark flash on every load.

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
- Grid/flex children that can hold a long password need `min-width: 0`, or min-content width blows out the layout on narrow viewports
- The history row in `HomeView` has a fixed height (`--history-h`), not `auto`. An `auto` row grows with its contents and pushes the password up every time an entry lands; the list scrolls inside the reserved box instead.
- Formatting: no semicolons, single quotes, 100 char print width (see `.prettierrc.json`)
- Path alias: `@/` maps to `./src/`

## Production

`server.js` is a Bun HTTP server that serves `/dist` with SPA fallback. The Dockerfile uses multi-stage Bun builds.
