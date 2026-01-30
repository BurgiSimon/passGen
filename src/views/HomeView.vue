<script setup>
import PasswordGen from '@/components/PasswordGen.vue'
import DotGrid from '@/components/DotGrid.vue'
</script>

<template>
  <div class="page-container">
    <!-- Background - outside of main flex container -->
    <DotGrid
      :dot-size="2"
      :gap="20"
      base-color="#27FF64"
      active-color="#27FF64"
      :proximity="150"
      :speed-trigger="100"
      :shock-radius="250"
      :shock-strength="5"
      class="dot-grid-bg"
    />

    <!-- Content -->
    <main>
      <PasswordGen />
    </main>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  width: 100%;
  background-color: #0a0a0a;
  position: relative;
}

.dot-grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

main {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
