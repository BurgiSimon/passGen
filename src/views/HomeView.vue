<script setup>
import { defineAsyncComponent } from 'vue'
import { useSkin } from '@/composables/useSkin'

// Only one skin is ever mounted, so shipping both in the entry bundle makes every
// visitor download the one they are not using. Glass drags in gsap, a WebGL shader
// and two webfonts; terminal drags in none of that. Splitting them means each
// visitor pays for their own skin only.
const GlassView = defineAsyncComponent(() => import('./GlassView.vue'))
const TerminalView = defineAsyncComponent(() => import('./TerminalView.vue'))

const { skin, toggleSkin } = useSkin()
</script>

<template>
  <GlassView v-if="skin === 'glass'" @switch-skin="toggleSkin" />
  <TerminalView v-else @switch-skin="toggleSkin" />
</template>
