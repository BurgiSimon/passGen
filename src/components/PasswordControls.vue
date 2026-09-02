<script setup>
// No password logic here — this only mutates the five models the parent's composable reacts to.
const length = defineModel('length', { type: Number })
const uppercase = defineModel('uppercase', { type: Boolean })
const numbers = defineModel('numbers', { type: Boolean })
const special = defineModel('special', { type: Boolean })
const noEdgeDigits = defineModel('noEdgeDigits', { type: Boolean })

// Plain array, so refs are not auto-unwrapped — the template writes `t.model.value`.
// `name` overrides the accessible name where the terse label needs spelling out.
const toggles = [
  { model: uppercase, label: 'UPPERCASE' },
  { model: numbers, label: 'NUMBERS' },
  { model: special, label: 'SPECIAL' },
  {
    model: noEdgeDigits,
    label: 'NO DIGIT AT EDGES',
    name: 'NO DIGIT AT EDGES: first and last character cannot be a number',
  },
]
</script>

<template>
  <div class="controls">
    <section class="sec">
      <div class="row">
        <label class="lbl" for="pg-length">LENGTH</label>
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
      <label v-for="t in toggles" :key="t.label" class="toggle">
        <input v-model="t.model.value" class="cb" type="checkbox" :aria-label="t.name" />
        <span class="box" aria-hidden="true">[<span class="x">x</span>]</span>
        <span class="txt">{{ t.label }}</span>
      </label>
    </section>
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

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.lbl {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--fg-dim);
}

.val {
  font-size: 1.5rem;
  line-height: 1;
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
  .txt {
    transition: none;
  }
}
</style>
