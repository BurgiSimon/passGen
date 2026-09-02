<script setup lang="ts">
interface Props {
  entries?: string[]
  lastCopied?: string
}

withDefaults(defineProps<Props>(), {
  entries: () => [],
  lastCopied: '',
})

const emit = defineEmits<{
  copy: [text: string]
  clear: []
}>()
</script>

<template>
  <section class="history" aria-labelledby="pg-history-heading">
    <div class="head">
      <h2 id="pg-history-heading" class="lbl">
        History
        <span class="note">— this session only, never saved</span>
      </h2>
      <button v-if="entries.length" type="button" class="clear" @click="emit('clear')">
        clear
      </button>
    </div>

    <p v-if="!entries.length" class="empty">No earlier passwords yet.</p>

    <ol v-else class="list">
      <li v-for="(entry, i) in entries" :key="i">
        <button
          type="button"
          class="row"
          :aria-label="`Copy earlier password ${i + 1} of ${entries.length}`"
          @click="emit('copy', entry)"
        >
          <span class="value">{{ entry }}</span>
          <span class="action">{{ lastCopied === entry ? 'copied' : 'copy' }}</span>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.history {
  border-top: 1px solid var(--border);
  padding: calc(var(--step) * 2) calc(var(--step) * 4);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--step);
}

.lbl,
.note,
.empty,
.action,
.clear {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  user-select: none;
}

.lbl {
  margin: 0;
  font-weight: inherit;
  color: var(--fg-dim);
}

.note {
  opacity: 0.75;
}

.empty {
  margin: var(--step) 0 0;
  color: var(--fg-dim);
  opacity: 0.75;
}

.clear {
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

.clear:hover,
.clear:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.list {
  margin: var(--step) 0 0;
  padding: 0;
  list-style: none;
  max-height: 30vh;
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--step) * 2);
  width: 100%;
  min-height: 32px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--fg-dim);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 120ms linear;
}

.row:hover,
.row:focus-visible {
  color: var(--fg);
}

.value {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action {
  flex: none;
  color: var(--fg-dim);
}

.row:hover .action,
.row:focus-visible .action {
  color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .row,
  .clear {
    transition: none;
  }
}
</style>
