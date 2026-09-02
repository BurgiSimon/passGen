<script setup lang="ts">
// Ported from vue-bits: https://vue-bits.dev/components/animated-list
// Restyled to the app's tokens, and adapted in four ways, all noted inline:
// a scoped slot so consumers keep semantic markup, no Tab hijacking,
// reduced-motion support, and gradients that also recompute on item change.
//
// Upstream drives the per-item scale/fade with motion-v's useInView. That is
// one IntersectionObserver and a spring engine per row; here it is a single
// shared observer plus a CSS transition, which is the same 0.7->1 scale and
// 0->1 fade with no dependency.
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface AnimatedListProps {
  items?: string[]
  showGradients?: boolean
  enableArrowNavigation?: boolean
  className?: string
  itemClassName?: string
  displayScrollbar?: boolean
  initialSelectedIndex?: number
}

const props = withDefaults(defineProps<AnimatedListProps>(), {
  items: () => [],
  showGradients: true,
  enableArrowNavigation: true,
  className: '',
  itemClassName: '',
  displayScrollbar: true,
  initialSelectedIndex: -1,
})

const emit = defineEmits<{
  itemSelected: [item: string, index: number]
}>()

const listRef = ref<HTMLDivElement | null>(null)
const selectedIndex = ref(props.initialSelectedIndex)
const keyboardNav = ref(false)
const topGradientOpacity = ref(0)
const bottomGradientOpacity = ref(0)

const handleItemMouseEnter = (index: number) => {
  selectedIndex.value = index
}

const handleItemClick = (item: string, index: number) => {
  selectedIndex.value = index
  emit('itemSelected', item, index)
}

// --- in-view scale/fade: one observer for the whole list ---

// Tracked by item, not by index. The consumer prepends, so index 0 refers to a
// different row after every generate — an index-keyed flag would leak the old
// row's "visible" state onto the new one and skip its entrance.
const inViewItems = ref(new Set<string>())
const reduced = ref(false)

let observer: IntersectionObserver | null = null
let motionQuery: MediaQueryList | null = null
const onMotionChange = () => (reduced.value = !!motionQuery?.matches)

// amount: 0.5 upstream — a row counts as visible once half of it is.
const reobserve = () => {
  if (!observer || !listRef.value) return
  observer.disconnect()
  for (const el of listRef.value.querySelectorAll<HTMLElement>('.anim-item')) observer.observe(el)
}

watch(
  () => props.items,
  async (items) => {
    // Drop entries that have aged out, so the set cannot grow without bound.
    const live = new Set(items)
    inViewItems.value = new Set([...inViewItems.value].filter((i) => live.has(i)))
    await nextTick()
    reobserve()
  },
  { deep: true },
)

const updateGradients = () => {
  const el = listRef.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  topGradientOpacity.value = Math.min(scrollTop / 50, 1)
  const bottomDistance = scrollHeight - (scrollTop + clientHeight)
  bottomGradientOpacity.value = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
}

// Upstream only recomputes on scroll, so the bottom fade is stale until the
// first scroll. The list changes length as passwords are generated.
watch(() => props.items.length, updateGradients, { flush: 'post' })
onMounted(updateGradients)

const handleKeyDown = (e: KeyboardEvent) => {
  // Upstream also captures Tab/Shift+Tab and preventDefaults it, which traps
  // focus for keyboard users. Arrow keys only here; Tab stays native.
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    keyboardNav.value = true
    selectedIndex.value = Math.min(selectedIndex.value + 1, props.items.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    keyboardNav.value = true
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    if (selectedIndex.value >= 0 && selectedIndex.value < props.items.length) {
      e.preventDefault()
      emit('itemSelected', props.items[selectedIndex.value], selectedIndex.value)
    }
  }
}

watch([selectedIndex, keyboardNav], () => {
  if (!keyboardNav.value || selectedIndex.value < 0 || !listRef.value) return
  const container = listRef.value
  const selectedItem = container.querySelector(
    `[data-index="${selectedIndex.value}"]`,
  ) as HTMLElement | null
  if (selectedItem) {
    const extraMargin = 50
    const containerScrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    const itemTop = selectedItem.offsetTop
    const itemBottom = itemTop + selectedItem.offsetHeight
    if (itemTop < containerScrollTop + extraMargin) {
      container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' })
    } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
      container.scrollTo({ top: itemBottom - containerHeight + extraMargin, behavior: 'smooth' })
    }
  }
  keyboardNav.value = false
})

onMounted(() => {
  if (props.enableArrowNavigation) window.addEventListener('keydown', handleKeyDown)

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  onMotionChange()
  motionQuery.addEventListener('change', onMotionChange)

  // A viewport-rooted observer still accounts for clipping by the scroll
  // container, so items hidden inside it read as out of view.
  observer = new IntersectionObserver(
    (entries) => {
      const rows = listRef.value ? [...listRef.value.children] : []
      const next = new Set(inViewItems.value)
      for (const entry of entries) {
        // Resolve the row's item by its current DOM position rather than a
        // data-* attribute, so the value never lands in the markup twice.
        const item = props.items[rows.indexOf(entry.target)]
        if (item === undefined) continue
        if (entry.isIntersecting) next.add(item)
        else next.delete(item)
      }
      inViewItems.value = next
    },
    { threshold: 0.5 },
  )
  reobserve()
})

onUnmounted(() => {
  if (props.enableArrowNavigation) window.removeEventListener('keydown', handleKeyDown)
  motionQuery?.removeEventListener('change', onMotionChange)
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="scroll-list-container" :class="className">
    <div
      ref="listRef"
      class="scroll-list"
      :class="{ 'no-scrollbar': !displayScrollbar }"
      @scroll="updateGradients"
    >
      <!-- Keyed by value, not index: the consumer prepends, and an index key
           would reuse the existing DOM node so the new row never animates in.
           Items are expected to be unique, as display strings usually are. -->
      <div
        v-for="(item, index) in items"
        :key="item"
        class="anim-item"
        :class="{ 'is-in-view': reduced || inViewItems.has(item) }"
        :data-index="index"
        @mouseenter="handleItemMouseEnter(index)"
        @click="handleItemClick(item, index)"
      >
        <div class="item" :class="[itemClassName, { 'is-selected': selectedIndex === index }]">
          <!-- Scoped slot so consumers can render accessible markup; upstream
               hardcodes a <p>, which cannot carry a button or a label. -->
          <slot :item="item" :index="index" :selected="selectedIndex === index">
            <p class="item-text">{{ item }}</p>
          </slot>
        </div>
      </div>
    </div>

    <template v-if="showGradients">
      <div class="fade fade-top" :style="{ opacity: topGradientOpacity }" aria-hidden="true" />
      <div
        class="fade fade-bottom"
        :style="{ opacity: bottomGradientOpacity }"
        aria-hidden="true"
      />
    </template>
  </div>
</template>

<style scoped>
.scroll-list-container {
  position: relative;
  height: 100%;
  min-height: 0;
}

.scroll-list {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.no-scrollbar {
  scrollbar-width: none;
}

.scroll-list::-webkit-scrollbar {
  width: 8px;
}

.scroll-list::-webkit-scrollbar-track {
  background: transparent;
}

/* Square, like every other edge in this UI. */
.scroll-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 0;
}

.scroll-list::-webkit-scrollbar-thumb:hover {
  background: var(--fg-dim);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* The upstream motion values, as a transition: scale 0.7 -> 1, opacity 0 -> 1,
   200ms, 100ms delay. */
.anim-item {
  transform: scale(0.7);
  opacity: 0;
  cursor: pointer;
  transition:
    transform 200ms ease,
    opacity 200ms ease;
  transition-delay: 100ms;
}

.anim-item.is-in-view {
  transform: none;
  opacity: 1;
}

.item {
  border: 1px solid transparent;
}

.item-text {
  margin: 0;
  padding: var(--step);
  color: var(--fg);
}

.fade {
  position: absolute;
  right: 0;
  left: 0;
  height: 40px;
  pointer-events: none;
  transition: opacity 300ms ease;
}

.fade-top {
  top: 0;
  background: linear-gradient(to bottom, var(--bg), transparent);
}

.fade-bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--bg), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .fade {
    transition: none;
  }
  .scroll-list {
    scroll-behavior: auto;
  }
  /* The global reset zeroes durations but not delays, and a row must never sit
     scaled down waiting for the observer. */
  .anim-item {
    transform: none;
    opacity: 1;
    transition-delay: 0s;
  }
}
</style>
