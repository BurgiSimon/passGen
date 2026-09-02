<script setup>
import GlassGen from '@/components/GlassGen.vue'
import DotGrid from '@/components/DotGrid.vue'
import MetallicPaint from '@/components/MetallicPaint.vue'
import lockSvg from '/lock.svg'

const emit = defineEmits(['switch-skin'])
</script>

<template>
  <div class="page-container">
    <!-- Logo top-left with metallic effect -->
    <div class="logo-container">
      <MetallicPaint
        :image-src="lockSvg"
        :seed="42"
        :scale="4"
        :pattern-sharpness="1"
        :noise-scale="0.5"
        :speed="0.3"
        :liquid="0.75"
        :mouse-animation="false"
        :brightness="2"
        :contrast="0.5"
        :refraction="0.01"
        :blur="0.015"
        :chromatic-spread="2"
        :fresnel="1"
        :angle="0"
        :wave-amplitude="1"
        :distortion="1"
        :contour="0.2"
        light-color="#ffffff"
        dark-color="#000000"
        tint-color="#27FF64"
      />
    </div>

    <!-- Skin picker — the terminal look lives one click away, glass stays the default -->
    <button
      type="button"
      class="skin-picker"
      aria-label="Switch to the terminal skin"
      @click="emit('switch-skin')"
    >
      skin: glass
    </button>

    <!-- Background - outside of main flex container -->
    <DotGrid
      :dot-size="1.5"
      :gap="30"
      base-color="#27FF64"
      active-color="#27FF64"
      :proximity="75"
      :speed-trigger="100"
      :shock-radius="125"
      :shock-strength="2.5"
      class="dot-grid-bg"
    />

    <!-- Content -->
    <main>
      <GlassGen />
    </main>
  </div>
</template>

<style scoped>
@import '@/fonts/tanker/css/tanker.css';
@import '@/fonts/satoshi/css/satoshi.css';

/* The glass skin is dark-only, so it pins its own scheme instead of inheriting
   whatever the terminal skin's theme toggle last left on <html>. */
.page-container {
  min-height: 100vh;
  width: 100%;
  background-color: #0a0a0a;
  color-scheme: dark;
  position: relative;
  font-family: 'Satoshi-Variable', sans-serif;
}

.page-container h1,
.page-container h2,
.page-container h3,
.page-container h4,
.page-container h5,
.page-container h6 {
  font-family: 'Tanker-Regular', sans-serif;
}

.logo-container {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: 4rem;
  height: 4rem;
  z-index: 20;
}

.skin-picker {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  padding: 0.4rem 0.75rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: hsla(0, 0%, 100%, 0.75);
  background: hsla(0, 0%, 100%, 0.1);
  backdrop-filter: blur(0.75em);
  -webkit-backdrop-filter: blur(0.75em);
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px hsla(0, 0%, 100%, 0.2) inset;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.skin-picker:hover {
  color: #27ff64;
  box-shadow: 0 0 0 1px hsla(142, 100%, 58%, 0.5) inset;
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
  padding-block: 5rem 2rem;
}
</style>
