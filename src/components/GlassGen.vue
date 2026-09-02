<script setup>
import { ref } from 'vue'
import ElasticSlider from './ElasticSlider.vue'
import DecryptedText from './DecryptedText.vue'
import { usePasswordGen } from '@/composables/usePasswordGen'
import { MIN_LENGTH, MAX_LENGTH, MIN_WORDS, MAX_WORDS, SEPARATORS } from '@/lib/passwordCore'

// The glass skin owns its own generator state — only one skin is mounted at a
// time, so there is nothing to share and nothing to keep in sync.
const {
  password,
  copied,
  lastCopied,
  history,
  clearHistory,
  mode,
  isPassphrase,
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
  generatePassword,
  copyToClipboard,
} = usePasswordGen()

// Clearing the list while the panel is open would leave the reserved slot
// holding an expanded, invisible panel — collapse it on the way out.
const historyOpen = ref(false)

const clearAndCollapse = () => {
  clearHistory()
  historyOpen.value = false
}

const SEPARATOR_LABELS = { '-': 'dash', '.': 'dot', _: 'underscore', ' ': 'space' }
</script>

<template>
  <div class="password-gen">
    <h1 class="title text-6xl font-extrabold mb-10 text-center">PassGen</h1>

    <!-- Password Display -->
    <div @click="copyToClipboard()" class="glass-panel password-display">
      <DecryptedText
        :key="password"
        :text="password || 'Click Generate'"
        :speed="10"
        :max-iterations="10"
        :sequential="false"
        reveal-direction="start"
        animate-on="view"
        class="password-text"
      />
      <span class="copy-hint" :class="{ copied: copied }">
        {{ copied ? 'Copied!' : 'Click to copy' }}
      </span>
    </div>

    <!-- Generate Button -->
    <button @click="generatePassword" class="glass-button">Generate Password</button>

    <!-- Options -->
    <div class="options-container">
      <!-- Mode -->
      <div class="glass-panel mode-switch">
        <button
          type="button"
          class="mode-button"
          :class="{ active: !isPassphrase }"
          @click="mode = 'random'"
        >
          Random
        </button>
        <button
          type="button"
          class="mode-button"
          :class="{ active: isPassphrase }"
          @click="mode = 'passphrase'"
        >
          Passphrase
        </button>
      </div>

      <!-- Length / word count -->
      <div class="glass-panel">
        <label class="option-label">{{ isPassphrase ? 'Words' : 'Password Length' }}</label>
        <ElasticSlider
          v-if="isPassphrase"
          v-model:defaultValue="wordCount"
          :starting-value="MIN_WORDS"
          :max-value="MAX_WORDS"
          :is-stepped="true"
          :step-size="1"
          class="mx-auto"
        />
        <ElasticSlider
          v-else
          v-model:defaultValue="passwordLength"
          :starting-value="MIN_LENGTH"
          :max-value="MAX_LENGTH"
          :is-stepped="true"
          :step-size="1"
          class="mx-auto"
        />
        <p class="detail">{{ detail }}</p>
      </div>

      <!-- Checkboxes -->
      <div v-if="!isPassphrase" class="glass-panel checkbox-group">
        <label class="checkbox-label">
          <input v-model="includeUppercase" type="checkbox" class="checkbox-input" />
          <span>Include Uppercase Letters</span>
        </label>

        <label class="checkbox-label">
          <input v-model="includeNumbers" type="checkbox" class="checkbox-input" />
          <span>Include Numbers</span>
        </label>

        <label class="checkbox-label">
          <input v-model="includeSpecialChars" type="checkbox" class="checkbox-input" />
          <span>Include Special Characters</span>
        </label>

        <label class="checkbox-label">
          <input v-model="noNumberFirstLast" type="checkbox" class="checkbox-input" />
          <span>First &amp; Last Character Can't Be a Number</span>
        </label>
      </div>

      <div v-else class="glass-panel checkbox-group">
        <label class="checkbox-label separator-row">
          <span>Separator</span>
          <select v-model="separator" class="separator-select">
            <option v-for="s in SEPARATORS" :key="s" :value="s">
              {{ SEPARATOR_LABELS[s] }} &nbsp;{{ s === ' ' ? '␣' : s }}
            </option>
          </select>
        </label>

        <label class="checkbox-label">
          <input v-model="capitalize" type="checkbox" class="checkbox-input" />
          <span>Capitalize Each Word</span>
        </label>

        <label class="checkbox-label">
          <input v-model="appendDigit" type="checkbox" class="checkbox-input" />
          <span>Append a Digit</span>
        </label>
      </div>

      <!-- Session history — in memory only, gone when the tab closes.
           Collapsed by default; <details> keeps the toggle native and
           keyboard-operable. Always rendered, only hidden while empty: a v-if
           here would pop the panel in after the first generate and shove the
           whole (vertically centred) column upwards. visibility:hidden keeps
           the slot's height and takes its contents out of the tab order. -->
      <details
        class="glass-panel history"
        :class="{ 'is-empty': !history.length }"
        :open="historyOpen"
        @toggle="historyOpen = $event.target.open"
      >
        <summary class="history-summary">
          <span class="history-label">History ({{ history.length }}) — this session only</span>
          <span class="history-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="history-head">
          <button type="button" class="clear-button" @click="clearAndCollapse">Clear</button>
        </div>
        <ul class="history-list">
          <li v-for="entry in history" :key="entry">
            <button type="button" class="history-item" @click="copyToClipboard(entry)">
              <span class="history-text">{{ entry }}</span>
              <span class="history-copied" :class="{ copied: lastCopied === entry }">
                {{ lastCopied === entry ? 'Copied!' : 'Copy' }}
              </span>
            </button>
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>

<style scoped>
/* Capped to the viewport (minus main's padding) and laid out as a column, so
   the open history absorbs whatever room is left over and scrolls inside it.
   Without the cap, expanding 10 entries makes the whole page scroll. */
.password-gen {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 28rem;
  max-height: calc(100dvh - 7rem);
  margin: 0 auto;
  padding: 1.5rem;
  font-weight: 600;
}

/* Everything but the history keeps its natural height. */
.password-gen > *:not(.options-container) {
  flex: none;
}

.title {
  color: #ffffff;
  font-family: 'Tanker-Regular', sans-serif;
}

/* Glass panel base style */
.glass-panel {
  background: hsla(0, 0%, 100%, 0.1);
  backdrop-filter: blur(0.75em);
  -webkit-backdrop-filter: blur(0.75em);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow:
    0 0 0 1px hsla(0, 0%, 100%, 0.2) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.2);
  transition: all 0.3s ease;
}

.glass-panel:hover {
  background: hsla(0, 0%, 100%, 0.15);
  box-shadow:
    0 0 0 1px hsla(0, 0%, 100%, 0.3) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.25);
}

/* Password display */
.password-display {
  position: relative;
  margin-bottom: 1rem;
  cursor: pointer;
}

.password-text {
  font-size: 1.25rem;
  font-family: monospace;
  text-align: center;
  color: #ffffff;
  word-break: break-all;
}

.copy-hint {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
  transition: color 0.3s ease;
}

.copy-hint.copied {
  color: #27ff64;
}

/* Generate button */
.glass-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, hsla(142, 100%, 58%, 0.3), hsla(142, 100%, 58%, 0.15));
  backdrop-filter: blur(0.75em);
  -webkit-backdrop-filter: blur(0.75em);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow:
    0 0 0 1px hsla(142, 100%, 58%, 0.4) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.2);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: linear-gradient(135deg, hsla(142, 100%, 58%, 0.4), hsla(142, 100%, 58%, 0.25));
  box-shadow:
    0 0 0 1px hsla(142, 100%, 58%, 0.6) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.3);
  transform: translateY(-2px);
}

/* Options container */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.options-container > *:not(.history) {
  flex: none;
}

.option-label {
  display: block;
  text-align: center;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.detail {
  margin: 0.5rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
}

/* Mode switch */
.mode-switch {
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem;
}

.mode-button {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font: inherit;
  font-weight: 600;
  color: hsla(0, 0%, 100%, 0.7);
  background: transparent;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button:hover {
  color: #ffffff;
}

.mode-button.active {
  color: #ffffff;
  background: linear-gradient(135deg, hsla(142, 100%, 58%, 0.3), hsla(142, 100%, 58%, 0.15));
  box-shadow: 0 0 0 1px hsla(142, 100%, 58%, 0.4) inset;
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: hsla(0, 0%, 100%, 0.9);
  transition: color 0.2s ease;
}

.checkbox-label:hover {
  color: #ffffff;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #27ff64;
  cursor: pointer;
}

.separator-row {
  justify-content: space-between;
}

.separator-select {
  padding: 0.35rem 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  color: #ffffff;
  background: hsla(0, 0%, 0%, 0.35);
  border: 1px solid hsla(0, 0%, 100%, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
}

.separator-select option {
  color: #ffffff;
  background: #101010;
}

/* History */
.history {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.history.is-empty {
  visibility: hidden;
}

.history-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  list-style: none;
}

/* Safari still paints the disclosure triangle without this. */
.history-summary::-webkit-details-marker {
  display: none;
}

.history-head {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.history-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: hsla(0, 0%, 100%, 0.6);
}

.history-summary:hover .history-label {
  color: #ffffff;
}

.history-chevron {
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
  transition: transform 0.2s ease;
}

.history[open] .history-chevron {
  transform: rotate(180deg);
}

.clear-button {
  padding: 0.15rem 0.5rem;
  font: inherit;
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
  background: transparent;
  border: 1px solid hsla(0, 0%, 100%, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  color: #27ff64;
  border-color: hsla(142, 100%, 58%, 0.5);
}

.history-list {
  /* Shrinks to the leftover space rather than a fixed height, so the panel
     never pushes the column past the viewport. */
  flex: 1 1 auto;
  min-height: 3rem;
  max-height: 12rem;
  margin: 0.5rem 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  /* A long passphrase's min-content width would otherwise blow out the panel. */
  min-width: 0;
  padding: 0.4rem 0.5rem;
  font: inherit;
  color: hsla(0, 0%, 100%, 0.75);
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.history-item:hover {
  color: #ffffff;
  background: hsla(0, 0%, 100%, 0.08);
}

.history-text {
  min-width: 0;
  overflow: hidden;
  font-family: monospace;
  font-size: 0.8125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-copied {
  flex: none;
  font-size: 0.7rem;
  color: hsla(0, 0%, 100%, 0.45);
}

.history-copied.copied {
  color: #27ff64;
}
</style>
