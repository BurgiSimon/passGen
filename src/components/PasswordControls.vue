<script setup>
import { computed } from 'vue'
import { SEPARATORS } from '@/lib/passwordCore'

// No password logic here — this only mutates the models the parent's composable reacts to.
const mode = defineModel('mode', { type: String })
const length = defineModel('length', { type: Number })
const uppercase = defineModel('uppercase', { type: Boolean })
const numbers = defineModel('numbers', { type: Boolean })
const special = defineModel('special', { type: Boolean })
const noEdgeDigits = defineModel('noEdgeDigits', { type: Boolean })
const words = defineModel('words', { type: Number })
const separator = defineModel('separator', { type: String })
const capitalize = defineModel('capitalize', { type: Boolean })
const appendDigit = defineModel('appendDigit', { type: Boolean })

const isPassphrase = computed(() => mode.value === 'passphrase')

// A space is invisible on a button, so it gets a name.
const sepLabel = (s) => (s === ' ' ? 'spc' : s)
const sepName = { '-': 'hyphen', '.': 'period', _: 'underscore', ' ': 'space' }

// Plain arrays, so refs are not auto-unwrapped — the template writes `t.model.value`.
// `name` overrides the accessible name where the terse label needs spelling out.
const randomToggles = [
  { model: uppercase, label: 'UPPERCASE' },
  { model: numbers, label: 'NUMBERS' },
  { model: special, label: 'SPECIAL' },
  {
    model: noEdgeDigits,
    label: 'NO DIGIT AT EDGES',
    name: 'NO DIGIT AT EDGES: first and last character cannot be a number',
  },
]

const phraseToggles = [
  {
    model: capitalize,
    label: 'CAPITALIZE',
    name: 'CAPITALIZE: upper-case the first letter of each word',
  },
  {
    model: appendDigit,
    label: 'APPEND DIGIT',
    name: 'APPEND DIGIT: add one random digit at the end',
  },
]
</script>

<template>
  <div class="controls">
    <fieldset class="sec seg-wrap">
      <legend class="lbl">Mode</legend>
      <div class="seg">
        <label v-for="m in ['random', 'passphrase']" :key="m" class="seg-item">
          <input v-model="mode" class="seg-input" type="radio" name="pg-mode" :value="m" />
          <span class="seg-face">{{ m }}</span>
        </label>
      </div>
    </fieldset>

    <!-- RANDOM -->
    <template v-if="!isPassphrase">
      <section class="sec">
        <div class="row">
          <label class="lbl" for="pg-length">Length</label>
          <span class="val">{{ length }}</span>
        </div>
        <input
          id="pg-length"
          v-model.number="length"
          class="range"
          type="range"
          min="13"
          max="24"
          step="1"
        />
        <div class="row lbl"><span>13</span><span>24</span></div>
      </section>

      <section class="sec">
        <label v-for="t in randomToggles" :key="t.label" class="toggle">
          <input v-model="t.model.value" class="cb" type="checkbox" :aria-label="t.name" />
          <span class="box" aria-hidden="true">[<span class="x">x</span>]</span>
          <span class="txt">{{ t.label }}</span>
        </label>
      </section>
    </template>

    <!-- PASSPHRASE -->
    <template v-else>
      <section class="sec">
        <div class="row">
          <label class="lbl" for="pg-words">Words</label>
          <span class="val">{{ words }}</span>
        </div>
        <input
          id="pg-words"
          v-model.number="words"
          class="range"
          type="range"
          min="3"
          max="8"
          step="1"
        />
        <div class="row lbl"><span>3</span><span>8</span></div>
      </section>

      <fieldset class="sec seg-wrap">
        <legend class="lbl">Separator</legend>
        <div class="seg">
          <label v-for="s in SEPARATORS" :key="s" class="seg-item">
            <input
              v-model="separator"
              class="seg-input"
              type="radio"
              name="pg-sep"
              :value="s"
              :aria-label="sepName[s]"
            />
            <span class="seg-face">{{ sepLabel(s) }}</span>
          </label>
        </div>
      </fieldset>

      <section class="sec">
        <label v-for="t in phraseToggles" :key="t.label" class="toggle">
          <input v-model="t.model.value" class="cb" type="checkbox" :aria-label="t.name" />
          <span class="box" aria-hidden="true">[<span class="x">x</span>]</span>
          <span class="txt">{{ t.label }}</span>
        </label>
      </section>
    </template>
  </div>
</template>

<style scoped>
.controls {
  user-select: none;
  -webkit-user-select: none;
}

.sec {
  padding: calc(var(--step) * 2);
}
.sec + .sec {
  border-top: 1px solid var(--border);
}

/* fieldset resets — it is here for the grouping semantics, not the chrome */
.seg-wrap {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--border);
}
.seg-wrap:first-child {
  border-top: 0;
}

.seg-wrap > .lbl {
  padding: 0;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.lbl {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-dim);
}

.val {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--fg);
}

/* Segmented radios: native inputs, so arrow-key navigation comes for free. */
.seg {
  display: flex;
  gap: var(--step);
  margin-top: var(--step);
}

.seg-item {
  position: relative;
  flex: 1;
  min-width: 44px;
}

.seg-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: 0;
  cursor: pointer;
}

.seg-face {
  display: block;
  padding: var(--step) 4px;
  border: 1px solid var(--border);
  color: var(--fg-dim);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  transition:
    color 120ms linear,
    border-color 120ms linear;
}

.seg-input:checked ~ .seg-face {
  border-color: var(--accent);
  color: var(--accent);
}

.seg-input:hover ~ .seg-face {
  color: var(--fg);
}

/* Range: track and thumb are the same height, so no centering math is needed. */
.range {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 20px;
  margin: calc(var(--step) * 1.5) 0 var(--step);
  padding: 0;
  background: none;
  cursor: pointer;
}

/* WebKit and Firefox pseudo-elements must stay in separate blocks — an unknown
   selector drops the whole rule. */
.range::-webkit-slider-runnable-track {
  box-sizing: border-box;
  height: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0;
}
.range::-moz-range-track {
  box-sizing: border-box;
  height: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--step);
  height: 18px;
  background: var(--accent);
  border: 0;
  border-radius: 0;
}
.range::-moz-range-thumb {
  width: var(--step);
  height: 18px;
  background: var(--accent);
  border: 0;
  border-radius: 0;
}

/* The checkbox is a transparent overlay on the whole row: native semantics and
   tab order intact, focus ring lands around the row, `[ ]` / `[x]` drawn by spans. */
.toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--step);
  min-height: 44px;
  cursor: pointer;
}

.cb {
  -webkit-appearance: none;
  appearance: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: none;
  border: 0;
  cursor: pointer;
}

.box,
.txt {
  color: var(--fg-dim);
  transition: color 120ms linear;
}

/* Hidden, not removed — `[ ]` and `[x]` keep the same width. */
.x {
  visibility: hidden;
}
.cb:checked ~ .box .x {
  visibility: visible;
}
.cb:checked ~ .box {
  color: var(--accent);
}
.cb:checked ~ .txt {
  color: var(--fg);
}

@media (prefers-reduced-motion: reduce) {
  .box,
  .txt,
  .seg-face {
    transition: none;
  }
}
</style>
