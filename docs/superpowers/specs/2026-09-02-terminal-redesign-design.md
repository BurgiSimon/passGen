# PassGen — Terminal/Brutalist Frontend Redesign

Date: 2026-09-02
Branch: `redesign/terminal-ui`
Status: awaiting approval

## Goal

Replace the entire frontend. Every product behavior survives; every pixel changes.
Direction chosen by the user: **terminal / brutalist**, **split output-hero + controls**,
**one new signature effect** (existing effects deleted), **logic extracted to a composable**,
**full responsive + accessibility pass**.

## Functional contract (must survive verbatim)

Sourced from `src/components/PasswordGen.vue:1-164`.

### Character sets
```
lowercase  abcdefghijklmnopqrstuvwxyz          always on, not toggleable
uppercase  ABCDEFGHIJKLMNOPQRSTUVWXYZ
numbers    0123456789
special    !@#$%^&*()_+-=[]{}|;:,.<>?
```
`charPool` = lowercase + optional sets. `nonNumberPool` = same minus numbers, used
only for first/last position. Lowercase is unconditional, so the pool is never empty.

### Generation
```
copied = false
vibrate(50)
if (noNumberFirstLast && length >= 2):
   [0] <- nonNumberPool ; [1..len-2] <- charPool ; [len-1] <- nonNumberPool
else:
   all <- charPool
```
**No "at least one of each set" guarantee.** A password with numbers enabled may contain
zero digits. This is preserved — adding a guarantee changes the output distribution.

### RNG
`crypto.getRandomValues` stays. `Math.random()` must never touch a real password
(it may drive the visual effect only).

### Persistence — cookies, unchanged keys and format
`<name>=<encodeURIComponent(value)>; expires=<UTC +365d>; path=/; SameSite=Lax`

| key | value |
|---|---|
| `pg_uppercase` | `"true"` / `"false"` |
| `pg_numbers` | `"true"` / `"false"` |
| `pg_special` | `"true"` / `"false"` |
| `pg_noNumFirstLast` | `"true"` / `"false"` |
| `pg_length` | integer string |

### Interaction
- Length range 13–24, step 1, default 16. Changing length auto-regenerates.
- `Space` / `Enter` → generate. Bare `c` → copy (when a password exists).
- Click the password → copy.
- Copy: `navigator.clipboard.writeText`, `copied` true for **2000 ms**, `vibrate(30)`.
- Haptics: `vibrate(50)` on generate, `vibrate(30)` on copy. Optional-chained.
- One route `/` via `vue-router` + `createWebHistory`. Kept — `server.js` SPA fallback depends on it.

### Deliberate behavior fixes

Six defects were found during discovery. Four are fixed, two disappear with the code that
carried them. Each is a correctness or security concern, not a style preference.

1. **`c` hijacks `Ctrl+C` / `Cmd+C`** (`PasswordGen.vue:66`) — bare `e.key === 'c'` matches with
   modifiers held and calls `preventDefault()`, breaking native copy page-wide.
   **Fix:** ignore the shortcut when `ctrlKey`, `metaKey`, or `altKey` is set.
2. **First paint ignores saved preferences** — `generatePassword()` runs at setup,
   `loadPreferences()` at mount, so a returning user's first password uses defaults unless
   their saved length differs from 16. **Fix:** load preferences synchronously before the
   first generate. `document.cookie` is readable at setup; no ordering hazard.
3. **`pg_length` is unvalidated** (`PasswordGen.vue:29`) — a hand-edited cookie of `abc`
   yields `NaN` and an empty password; `500` generates a 500-char password.
   A cookie is user-controlled input at a trust boundary. **Fix:** clamp to 13–24,
   fall back to 16 on `NaN`.
4. **Modulo bias** in `pool[u32 % pool.length]` — negligible in magnitude but free to remove.
   **Fix:** rejection sampling, discard values above the largest multiple of `pool.length`.
5. `DotGrid` binding `click` to `window` — gone with the component.
6. `MetallicPaint`'s blocking 200-iteration Laplace solve and leaked WebGL texture — gone with the component.

Also preserved from the old code: the screen-reader mirror of the password text that
`DecryptedText` provided is the app's only accessibility affordance today. The new
effect must keep an equivalent (`aria-live` region carrying the real text).

## Visual direction

Terminal/brutalist. Not a skin over the glass UI — a different grammar.

- **Zero border-radius.** 1px hairline borders, hard corners, visible structure.
- **Monospace everywhere**, via the native `ui-monospace` stack. No webfont download,
  no `@font-face`, no layout shift. Satoshi and Tanker (66 committed font files) are deleted.
- **Density over air.** Tight, aligned, grid-locked. Labels uppercase, 11px, letter-spaced.
- **One accent**, the existing `#27FF64`, used only for state: active toggle, focus ring,
  copy confirmation, the settle flash. Never decorative.
- **Background** is a static CSS layer — hairline grid, scanlines, vignette. No canvas, no rAF.

### Tokens (`src/style.css`)
```css
--bg:      #0a0a0a   /* page */
--surface: #101010   /* panels */
--fg:      #e8e8e8   /* primary text */
--fg-dim:  #6b6b6b   /* labels, hints */
--border:  #262626   /* hairlines */
--accent:  #27FF64
--accent-dim: #27ff6433
--font-mono: ui-monospace, 'SF Mono', 'Cascadia Mono', 'Roboto Mono', Menlo, Consolas, monospace
--step: 8px          /* everything is a multiple */
```

### Layout — split hero + controls

```
┌──────────────────────────────────────────────────────────┐
│ passgen                              crypto.getRandomValues│  header, 1px bottom border
├────────────────────────────────┬─────────────────────────┤
│                                │ LENGTH             16   │
│  Xk9$mQ2#vL8pR4wZ              │ ──────●──────────────   │
│                                │ 13                  24  │
│  16 chars · pool 62            │                         │
│                                │ [x] UPPERCASE           │
│  [ COPY ]                      │ [x] NUMBERS             │
│                                │ [ ] SPECIAL             │
│  ─────────────────────────     │ [x] NO DIGIT AT EDGES   │
│  [ GENERATE ]                  │                         │
├────────────────────────────────┴─────────────────────────┤
│ space/enter regenerate   c copy                          │  footer legend
└──────────────────────────────────────────────────────────┘
```

- Desktop ≥900px: `grid-template-columns: minmax(0,1fr) 320px`. Hero left, controls right.
- Below 900px: single column, hero first, controls below, footer legend stays.
- Password type scales `clamp(1.5rem, 4.2vw, 3.5rem)`, `word-break: break-all`,
  so a 24-char password never overflows on a 320px screen.
- Hero fills available height on desktop; nothing scrolls at default settings.

### Signature effect — GLYPH CASCADE

Replaces MetallicPaint, DotGrid, and DecryptedText with one idea.

On generate, every character slot rolls through random glyphs and settles left to right:

- Each slot `i` starts rolling immediately, settles at `i * 18ms + 90ms`.
- While rolling, a slot shows a random glyph from the active pool, swapped every ~35ms.
- A `█` block cursor renders one slot ahead of the settle front and sweeps across.
- A settling slot flashes `--accent`, decaying to `--fg` over 240ms.
- Driven by a single `requestAnimationFrame` loop that stops when the last slot settles.
  No permanent loop, no library, no canvas. `Math.random()` for glyphs — display only.
- `prefers-reduced-motion: reduce` → text appears instantly, no roll, no flash.
- The real password lives in a visually-hidden `aria-live="polite"` node; the animated
  glyphs are `aria-hidden`. Screen readers never hear the scramble.

Copy confirmation reuses the same grammar: the label swaps to `COPIED` and the hero
border flashes accent for the 2000 ms `copied` window.

## Architecture

```
src/
  lib/passwordCore.js         pure, framework-free: char sets, secure random, generate()
  lib/passwordCore.check.mjs  one runnable assert script (node, no framework)
  composables/usePasswordGen.js  Vue state, cookies, clipboard, haptics, shortcuts
  components/PasswordOutput.vue  hero: glyph cascade, copy, meta line
  components/PasswordControls.vue  length + four toggles
  views/HomeView.vue          frame: header, split grid, footer legend
  style.css                   tokens, reset, background layer
```

Deleted: `PasswordGen.vue`, `DotGrid.vue`, `MetallicPaint.vue`, `DecryptedText.vue`,
`ElasticSlider.vue`, `src/fonts/`. Dependency `gsap` dropped (its only consumer was DotGrid).

`src/lib/passwordCore.js` exists so the generation logic can be asserted by a plain
`node` script with no test framework and no Vue import.

### Composable API — the contract every component codes against

```js
const {
  password,              // Ref<string>
  copied,                // Ref<boolean>
  passwordLength,        // Ref<number>   13..24
  includeUppercase,      // Ref<boolean>
  includeNumbers,        // Ref<boolean>
  includeSpecialChars,   // Ref<boolean>
  noNumberFirstLast,     // Ref<boolean>
  charPool,              // ComputedRef<string>  drives the effect's glyph alphabet
  generatePassword,      // () => void
  copyToClipboard,       // () => Promise<void>
} = usePasswordGen()
```

`usePasswordGen()` is called once, in `HomeView.vue`, and the refs are passed down as
props with `update:` emits — no provide/inject, no store. Two consumers do not justify one.

### Controls

- Length uses a native `<input type="range">`, styled brutalist. This replaces
  `ElasticSlider.vue`'s 369 lines of hand-rolled spring physics with ~20 lines of CSS
  and gets keyboard support, `aria-valuenow`, and touch handling for free.
- Toggles are native `<input type="checkbox">` with the box drawn in CSS as `[ ]` / `[x]`.
  Native semantics, native keyboard, `accent-color` unnecessary.
- The keydown guard stays tag-based (`INPUT`/`TEXTAREA`/`SELECT`) plus `isContentEditable`.
  Because both controls remain native form elements, the existing guard keeps working and
  `Space` will not both toggle a checkbox and regenerate.

### Accessibility

- Every control is a native focusable element with a real `<label>`.
- Visible focus: `outline: 2px solid var(--accent); outline-offset: 2px`. Never removed.
- Password exposed via `aria-live="polite"`; scramble glyphs `aria-hidden`.
- Copy result announced (`COPIED` in a live region), not colour-only.
- `prefers-reduced-motion` honored by the cascade and every transition.
- Contrast: `--fg` on `--bg` ≈ 15:1; `--fg-dim` on `--bg` ≈ 4.6:1, used only for
  non-essential labels; `--accent` on `--bg` ≈ 12:1.

## Testing

- `bun src/lib/passwordCore.check.mjs` — asserts length, edge-position rule, pool
  composition per option combination, that disabling every optional set still yields
  lowercase-only output, and that 20k samples cover the whole pool (catches a broken
  rejection-sampling bound).
- `bun run build` must pass.
- Manual: shortcuts, `Ctrl+C` no longer hijacked, cookie round-trip across reload,
  reload with a saved non-default option set produces a first password honoring it,
  320px and 1440px layouts, keyboard-only traverse, reduced-motion.

## Out of scope

- No entropy/strength meter — not requested; it would be net-new behavior.
- No password history, no passphrase mode, no theming, no light mode.
- No test framework, no TypeScript checking, no router changes.
- `server.js` port mismatch with the README (80 vs documented 3000) is noted but untouched.

## Execution

Four agents in parallel over disjoint files, then integration:

| Agent | Files |
|---|---|
| A | `src/lib/passwordCore.js`, `src/lib/passwordCore.check.mjs`, `src/composables/usePasswordGen.js` |
| B | `src/style.css`, `index.html`, `src/views/HomeView.vue` |
| C | `src/components/PasswordOutput.vue` |
| D | `src/components/PasswordControls.vue` |

Integration (main thread): delete the five old components and `src/fonts/`, drop `gsap`
from `package.json`, regenerate `bun.lock`, run the check script and the build, verify.
