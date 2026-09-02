# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PassGen is a password generator web app built with Vue 3 (Composition API), Vite, and Tailwind CSS 4. Two modes — random characters and EFF-wordlist passphrases — with a session-only history.

There are **two skins** over the same generator, picked with the button in the top bar and persisted in `pg_skin`:

- **`glass`** — the default. Dark-only, Satoshi/Tanker webfonts, frosted panels, animated dot-grid background, metallic WebGL lock logo.
- **`terminal`** — brutalist: monospace, zero border-radius, hairline borders, one accent colour used only to signal state, plus a light/dark/system theme toggle.

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
- **Single route** (`/`) renders `HomeView.vue`, which does nothing but pick a skin: `GlassView.vue` or `TerminalView.vue`. Only one is mounted at a time, so each skin calls `usePasswordGen()` for itself — there is no shared state to keep in sync, no store, no provide/inject. Switching skins therefore resets the session (fresh password, empty history); the cookie-backed preferences survive.
- **`src/views/TerminalView.vue`** — terminal skin shell; the only place `usePasswordGen()` state is passed down as props and `v-model`s (to `PasswordOutput` / `PasswordControls` / `PasswordHistory`).
- **`src/views/GlassView.vue`** — glass skin shell: `DotGrid` background, `MetallicPaint` logo, skin picker. Renders `GlassGen.vue`, which holds the whole glass UI in one component (the original `PasswordGen.vue`, rewired to `usePasswordGen()` so both skins share one CSPRNG path — the old inline `getRandomChar` had modulo bias).
- **`src/composables/useSkin.js`** — `glass` / `terminal`, persisted in `pg_skin`, default `glass`.
- **`src/lib/passwordCore.js`** — pure generation logic. No Vue, no DOM. Character sets, CSPRNG with rejection sampling, `generate()`, `generatePassphrase()`, and the `clamp*` cookie guards. Assertable by a plain script.
- **`src/lib/wordlist.js`** — EFF Short Wordlist #1, CC BY 3.0 US. 1295 words (see the file header for the one deliberate omission).
- **`src/lib/cookies.js`** — cookie read/write plus `getBool`/`getEnum` validators.
- **`src/composables/usePasswordGen.js`** — Vue state, cookie persistence, clipboard, haptics, history, global keyboard shortcuts.
- **`src/composables/useTheme.js`** — `system` / `dark` / `light`, persisted in `pg_theme`.
- **`src/components/{DotGrid,MetallicPaint,ElasticSlider,DecryptedText}.vue`** — glass-skin-only vue-bits components. `DotGrid` is the one reason `gsap` is a dependency.
- **`src/components/PasswordOutput.vue`** — password hero, copy/generate buttons, and the glyph-cascade reveal animation (one self-terminating rAF loop, no library).
- **`src/components/PasswordControls.vue`** — mode switch, native `<input type=range>`, native radios and checkboxes styled as `[x]` / `[ ]`.
- **`src/components/PasswordHistory.vue`** — the session history list.
- **`src/components/AnimatedList.vue`** — vue-bits AnimatedList, ported and restyled. **No dependency**: upstream's per-row `motion-v` `useInView` is replaced by one shared `IntersectionObserver` plus a CSS transition, same 0.7→1 scale and 0→1 fade. Other deviations, all commented in the file: a scoped slot (upstream hardcodes a `<p>`, which cannot hold a button), no Tab hijacking, reduced-motion support, and gradients that recompute on item change rather than only on scroll.
  In-view state is keyed by **item value, not index** — the consumer prepends, so index 0 means a different row after every generate, and an index-keyed flag makes the new row inherit the old one's "visible" state and skip its entrance. The `v-for` key matches, so items must be unique.

### Behavior that must not drift

- Lowercase is always included and is not a toggle. There is deliberately **no** "at least one of each set" guarantee — adding one would change the output distribution.
- Passwords come from `crypto.getRandomValues` only. `Math.random()` is for the reveal animation and must never touch a password.
- Cookie keys `pg_uppercase`, `pg_numbers`, `pg_special`, `pg_noNumFirstLast`, `pg_length` — 365 days, `SameSite=Lax`. `pg_length` is user-editable input and is clamped on read.
- Controls must stay **native** form elements, so they keep their own keyboard behaviour.
- The global keydown handler bails out whenever the event target is inside any interactive element (`button, a[href], input, textarea, select, [role=button]`). Narrowing that back to tag names would `preventDefault()` Enter and Space on focused buttons, making every button tabbable but not operable.
- Shortcuts ignore `ctrl`/`meta`/`alt` so `Ctrl+C` is not hijacked.
- **History is in-memory only and must stay that way.** Writing generated passwords to a cookie, `localStorage`, or `sessionStorage` would leave plaintext secrets readable by any script on the origin. The list dies with the tab, and the UI says so.
- No word in `wordlist.js` may contain a separator, or a phrase becomes ambiguous to read back. The check script asserts this.
- The theme toggle (`useTheme`) belongs to the terminal skin only. The glass skin is dark by design and pins `color-scheme: dark` on its own root, so a light-theme pin left on `<html>` cannot leak into it.
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
