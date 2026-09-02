<script setup>
import { usePasswordGen } from '@/composables/usePasswordGen'
import PasswordOutput from '@/components/PasswordOutput.vue'
import PasswordControls from '@/components/PasswordControls.vue'

const {
  password,
  copied,
  passwordLength,
  includeUppercase,
  includeNumbers,
  includeSpecialChars,
  noNumberFirstLast,
  charPool,
  generatePassword,
  copyToClipboard,
} = usePasswordGen()
</script>

<template>
  <!-- static texture: hairline grid + vignette, no canvas, no rAF -->
  <div class="texture" aria-hidden="true"></div>

  <div class="shell">
    <header class="bar">
      <span class="brand">passgen</span>
      <span class="source">crypto.getRandomValues</span>
    </header>

    <main class="split">
      <div class="col">
        <PasswordOutput
          :password="password"
          :copied="copied"
          :alphabet="charPool"
          @generate="generatePassword"
          @copy="copyToClipboard"
        />
      </div>

      <div class="col col-controls">
        <PasswordControls
          v-model:length="passwordLength"
          v-model:uppercase="includeUppercase"
          v-model:numbers="includeNumbers"
          v-model:special="includeSpecialChars"
          v-model:no-edge-digits="noNumberFirstLast"
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
    radial-gradient(120% 90% at 50% 45%, transparent 35%, rgb(0 0 0 / 0.6) 100%),
    repeating-linear-gradient(to right, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 32px),
    repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 32px);
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

.col {
  display: grid;
  min-width: 0;
}

.col-controls {
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
</style>
