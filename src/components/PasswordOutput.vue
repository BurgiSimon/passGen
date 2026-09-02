<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  password?: string
  copied?: boolean
  alphabet?: string
}

const props = withDefaults(defineProps<Props>(), {
  password: '',
  copied: false,
  alphabet: 'abcdefghijklmnopqrstuvwxyz',
})

const emit = defineEmits<{
  generate: []
  copy: []
}>()

const SETTLE_STEP = 18 // ms between slots
const SETTLE_DELAY = 90 // ms before slot 0 settles
const ROLL_MS = 35 // glyph re-roll interval

type Slot = { ch: string; settled: boolean; cursor: boolean }

const slots = ref<Slot[]>([])
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

let raf: number | null = null

// display only — never touches the real password value
const roll = () => props.alphabet[Math.floor(Math.random() * props.alphabet.length)] ?? '·'

const stop = () => {
  if (raf !== null) cancelAnimationFrame(raf)
  raf = null
}

const settleAll = () => {
  slots.value = [...props.password].map((ch) => ({ ch, settled: true, cursor: false }))
}

watch(
  () => props.password,
  (pw) => {
    stop()
    if (!pw || reduced.matches) return settleAll()

    const n = pw.length
    const end = (n - 1) * SETTLE_STEP + SETTLE_DELAY
    let glyphs = Array.from({ length: n }, roll)
    let start = 0
    let lastRoll = 0

    const tick = (now: number) => {
      if (!start) start = now
      const t = now - start

      if (t - lastRoll >= ROLL_MS) {
        glyphs = glyphs.map(roll)
        lastRoll = t
      }

      const front = Math.max(0, Math.min(n, Math.floor((t - SETTLE_DELAY) / SETTLE_STEP) + 1))
      slots.value = Array.from({ length: n }, (_, i) => ({
        ch: i < front ? pw[i] : i === front ? '█' : glyphs[i],
        settled: i < front,
        cursor: i === front,
      }))

      if (t >= end) {
        raf = null
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
  },
  { immediate: true },
)

onUnmounted(stop)
</script>

<template>
  <section class="output">
    <p class="sr-only" aria-live="polite">{{ password }}</p>
    <p class="sr-only" aria-live="polite">{{ copied ? 'password copied to clipboard' : '' }}</p>

    <button
      type="button"
      class="hero"
      :class="{ 'is-copied': copied }"
      aria-label="copy password to clipboard"
      @click="emit('copy')"
    >
      <span class="glyphs" aria-hidden="true">
        <span
          v-for="(slot, i) in slots"
          :key="i"
          class="glyph"
          :class="{ 'is-settled': slot.settled, 'is-cursor': slot.cursor }"
          >{{ slot.ch }}</span
        >
      </span>
    </button>

    <p class="meta">{{ password.length }} chars · pool {{ alphabet.length }}</p>

    <div class="actions">
      <button
        type="button"
        class="btn"
        :aria-label="copied ? 'copied — password in clipboard' : 'copy password'"
        @click="emit('copy')"
      >
        {{ copied ? 'copied' : 'copy' }}
      </button>
      <button
        type="button"
        class="btn"
        aria-label="generate a new password"
        @click="emit('generate')"
      >
        generate
      </button>
    </div>
  </section>
</template>

<style scoped>
.output {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: calc(var(--step) * 2);
  height: 100%;
  padding: calc(var(--step) * 4);
}

.hero {
  display: block;
  width: 100%;
  padding: calc(var(--step) * 1.5);
  border: 1px solid transparent;
  background: none;
  color: var(--fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms linear;
}

.hero:hover {
  border-color: var(--border);
}

.hero.is-copied {
  border-color: var(--accent);
}

.glyphs {
  display: block;
  font-size: clamp(1.5rem, 4.2vw, 3.5rem);
  line-height: 1.25;
  letter-spacing: 0.02em;
  word-break: break-all;
  user-select: text;
}

.glyph {
  color: var(--fg-dim);
}

.glyph.is-cursor {
  color: var(--accent);
}

.glyph.is-settled {
  color: var(--fg);
  animation: settle 240ms ease-out;
}

@keyframes settle {
  from {
    color: var(--accent);
  }
}

.meta {
  margin: 0;
  padding-inline: calc(var(--step) * 1.5);
  color: var(--fg-dim);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  user-select: none;
}

.actions {
  display: flex;
  gap: var(--step);
  padding-inline: calc(var(--step) * 1.5);
}

.btn {
  padding: var(--step) calc(var(--step) * 2);
  border: 1px solid var(--border);
  background: none;
  color: var(--fg);
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  transition:
    color 120ms linear,
    border-color 120ms linear;
}

.btn:hover,
.btn:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (prefers-reduced-motion: reduce) {
  .hero,
  .btn {
    transition: none;
  }

  .glyph.is-settled {
    animation: none;
  }
}
</style>
