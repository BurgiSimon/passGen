<script setup>
import PasswordGen from '@/components/PasswordGen.vue'
import DotGrid from '@/components/DotGrid.vue'
import MetallicPaint from '@/components/MetallicPaint.vue'
import lockSvg from '/lock.svg'
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

    <!-- Background - outside of main flex container -->
    <DotGrid
      :dot-size="1"
      :gap="30"
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
@import '@/fonts/tanker/css/tanker.css';
@import '@/fonts/satoshi/css/satoshi.css';

.page-container {
  min-height: 100vh;
  width: 100%;
  background-color: #0a0a0a;
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
