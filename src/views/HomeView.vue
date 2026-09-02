<script setup>
import { usePasswordGen } from '@/composables/usePasswordGen'
import { useTheme } from '@/composables/useTheme'
import PasswordOutput from '@/components/PasswordOutput.vue'
import PasswordControls from '@/components/PasswordControls.vue'
import PasswordHistory from '@/components/PasswordHistory.vue'

const {
  password,
  copied,
  lastCopied,
  history,
  clearHistory,
  mode,
  bits,
  strength,
  detail,
  passwordLength,
  includeUppercase,
  includeNumbers,
  includeSpecialChars,
  noNumberFirstLast,
  wordCount,
  separator,
  capitalize,
  appendDigit,
  charPool,
  generatePassword,
  copyToClipboard,
} = usePasswordGen()

const { theme, cycleTheme } = useTheme()
</script>

<template>
  <!-- static texture: hairline grid + vignette, no canvas, no rAF -->
  <div class="texture" aria-hidden="true"></div>

  <div class="shell">
    <header class="bar">
      <span class="brand">passgen</span>
      <span class="right">
        <button
          type="button"
          class="theme"
          :aria-label="`Theme: ${theme}. Change theme.`"
          @click="cycleTheme"
        >
          theme: {{ theme }}
        </button>
        <span class="source">crypto.getRandomValues</span>
      </span>
    </header>

    <main class="split">
      <div class="col">
        <PasswordOutput
          :password="password"
          :copied="copied"
          :alphabet="charPool"
          :bits="bits"
          :strength="strength"
          :detail="detail"
          @generate="generatePassword"
          @copy="copyToClipboard"
        />
        <PasswordHistory
          :entries="history"
          :last-copied="lastCopied"
          @copy="copyToClipboard"
          @clear="clearHistory"
        />
      </div>

      <div class="col col-controls">
        <PasswordControls
          v-model:mode="mode"
          v-model:length="passwordLength"
          v-model:uppercase="includeUppercase"
          v-model:numbers="includeNumbers"
          v-model:special="includeSpecialChars"
          v-model:no-edge-digits="noNumberFirstLast"
          v-model:words="wordCount"
          v-model:separator="separator"
          v-model:capitalize="capitalize"
          v-model:append-digit="appendDigit"
        />
      </div>
    </main>

    <footer class="bar legend">
      <span><kbd>space</kbd><kbd>enter</kbd> regenerate</span>
      <span><kbd>c</kbd> copy</span>
    </footer>
  </div>
</template>

<style scoped>
.texture {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(120% 90% at 50% 45%, transparent 35%, var(--vignette) 100%),
    repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 32px),
    repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 32px);
  color: var(--grid-line);
}

.shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
}

.bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(var(--step) * 2);
  padding: calc(var(--step) * 1.5) calc(var(--step) * 2);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  user-select: none;
}

header.bar {
  border-bottom: 1px solid var(--border);
}

.brand {
  color: var(--accent);
}

.right {
  display: flex;
  align-items: baseline;
  gap: calc(var(--step) * 2);
  min-width: 0;
}

.theme {
  flex: none;
  padding: 2px var(--step);
  border: 1px solid var(--border);
  background: none;
  color: var(--fg-dim);
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color 120ms linear,
    border-color 120ms linear;
}

.theme:hover,
.theme:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.source {
  min-width: 0;
  overflow: hidden;
  color: var(--fg-dim);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

/* The history row is a fixed height, not `auto`. If it grew with its contents
   it would eat into the 1fr row and shove the password up every time a new
   entry landed — the list scrolls inside this box instead. */
.col {
  /* Viewport-relative, so it scales with the screen — but fixed for any given
     viewport, which is what keeps the password still. */
  --history-h: clamp(140px, 24vh, 260px);

  display: grid;
  grid-template-rows: minmax(0, 1fr) var(--history-h);
  min-width: 0;
}

/* Grid items default to min-width: auto, so a long passphrase's min-content
   width would push the column past a narrow viewport. */
.col > * {
  min-width: 0;
}

.col-controls {
  grid-template-rows: auto;
  align-content: start;
  border-top: 1px solid var(--border);
}

@media (min-width: 900px) {
  .split {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .col-controls {
    border-top: 0;
    border-left: 1px solid var(--border);
  }
}

.legend {
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: var(--step) calc(var(--step) * 3);
  border-top: 1px solid var(--border);
  color: var(--fg-dim);
}

kbd {
  display: inline-block;
  margin-right: 4px;
  padding: 1px 5px;
  border: 1px solid var(--border);
  color: var(--fg);
  font: inherit;
}

@media (prefers-reduced-motion: reduce) {
  .theme {
    transition: none;
  }
}

@media (max-width: 599px) {
  .source {
    display: none;
  }
}
</style>
