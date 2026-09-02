<script setup lang="ts">
// Ported from vue-bits: https://vue-bits.dev/components/animated-list
// Restyled to the app's tokens, and adapted in three ways, all noted inline:
// a scoped slot so consumers keep semantic markup, no Tab hijacking, and
// reduced-motion support.
import { motion, useInView, useReducedMotion } from 'motion-v'
import { defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue'

const AnimatedItem = defineComponent({
  name: 'AnimatedItem',
  props: {
    index: { type: Number, required: true },
    delay: { type: Number, default: 0 },
  },
  emits: ['mouseenter', 'click'],
  setup(props, { slots, emit }) {
    const itemRef = ref<HTMLElement | null>(null)
    const inView = useInView(itemRef, { amount: 0.5, once: false })
    const reduced = useReducedMotion()

    const hidden = { scale: 0.7, opacity: 0 }
    const shown = { scale: 1, opacity: 1 }

    return () =>
      h(
        motion.div,
        {
          ref: itemRef,
          'data-index': props.index,
          // Upstream animates opacity to 0 out of view. Honouring reduced motion
          // means no scale and no fade — the row must stay readable either way.
          initial: reduced.value ? shown : hidden,
          animate: reduced.value ? shown : inView.value ? shown : hidden,
          transition: reduced.value ? { duration: 0 } : { duration: 0.2, delay: props.delay },
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onClick: (e: MouseEvent) => emit('click', e),
        },
        slots.default?.(),
      )
  },
})

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
})

onUnmounted(() => {
  if (props.enableArrowNavigation) window.removeEventListener('keydown', handleKeyDown)
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
      <AnimatedItem
        v-for="(item, index) in items"
        :key="index"
        :index="index"
        :delay="0.1"
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
      </AnimatedItem>
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
}
</style>
