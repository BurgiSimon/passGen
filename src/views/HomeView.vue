<script setup>
import { useSkin } from '@/composables/useSkin'
import GlassView from './GlassView.vue'
import TerminalView from './TerminalView.vue'

const { skin, toggleSkin } = useSkin()
</script>

<template>
  <GlassView v-if="skin === 'glass'" @switch-skin="toggleSkin" />
  <TerminalView v-else @switch-skin="toggleSkin" />
</template>
