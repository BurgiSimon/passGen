<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ElasticSlider from './ElasticSlider.vue'
import DecryptedText from './DecryptedText.vue'

// Cookie helpers
const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Load saved preferences from cookies
const loadPreferences = () => {
  const uppercase = getCookie('pg_uppercase')
  const numbers = getCookie('pg_numbers')
  const special = getCookie('pg_special')
  const noNumFirstLast = getCookie('pg_noNumFirstLast')
  const length = getCookie('pg_length')
  const copy = getCookie('pg_copyOnGen')

  if (uppercase !== null) includeUppercase.value = uppercase === 'true'
  if (numbers !== null) includeNumbers.value = numbers === 'true'
  if (special !== null) includeSpecialChars.value = special === 'true'
  if (noNumFirstLast !== null) noNumberFirstLast.value = noNumFirstLast === 'true'
  if (length !== null) passwordLength.value = parseInt(length, 10)
  if (copy !== null) copyOnGen.value = copy === 'true' 
}

// Save preferences to cookies
const savePreferences = () => {
  setCookie('pg_uppercase', includeUppercase.value)
  setCookie('pg_numbers', includeNumbers.value)
  setCookie('pg_special', includeSpecialChars.value)
  setCookie('pg_noNumFirstLast', noNumberFirstLast.value)
  setCookie('pg_length', passwordLength.value)
  setCookie('pg_copyOnGen', copyOnGen.value)
}

// Options
const includeUppercase = ref(true)
const includeNumbers = ref(true)
const includeSpecialChars = ref(false)
const noNumberFirstLast = ref(true)
const passwordLength = ref(16)
const copyOnGen = ref(true) 

// Watch for option changes and save to cookies
watch(
  [includeUppercase, includeNumbers, includeSpecialChars, noNumberFirstLast, passwordLength, copyOnGen],
  savePreferences,
)



// Keyboard shortcuts
const handleKeydown = (e) => {
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    generatePassword()
  }

  if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
    if (password.value) {
      e.preventDefault()
      copyToClipboard()
    }
  }
}

// Load preferences and register shortcuts on mount
onMounted(() => {
  loadPreferences()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  generatePassword()
  window.removeEventListener('keydown', handleKeydown)
})

// Password state
const password = ref('')
const copied = ref(false)

// Character sets
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const numberChars = '0123456789'
const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

// Build character pool based on options
const charPool = computed(() => {
  let pool = lowercaseChars
  if (includeUppercase.value) pool += uppercaseChars
  if (includeNumbers.value) pool += numberChars
  if (includeSpecialChars.value) pool += specialChars
  return pool
})

// Non-number characters for first/last position
const nonNumberPool = computed(() => {
  let pool = lowercaseChars
  if (includeUppercase.value) pool += uppercaseChars
  if (includeSpecialChars.value) pool += specialChars
  return pool
})

// Generate random character from a pool
const getRandomChar = (pool) => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return pool[array[0] % pool.length]
}

// Generate password
const generatePassword = () => {
  copied.value = false
  navigator.vibrate?.(50)
  let newPassword = ''
  const length = passwordLength.value

  if (noNumberFirstLast.value && length >= 2) {
    // First character (no number)
    newPassword += getRandomChar(nonNumberPool.value)

    // Middle characters
    for (let i = 1; i < length - 1; i++) {
      newPassword += getRandomChar(charPool.value)
    }

    // Last character (no number)
    newPassword += getRandomChar(nonNumberPool.value)
  } else {
    for (let i = 0; i < length; i++) {
      newPassword += getRandomChar(charPool.value)
    }
  }

  password.value = newPassword

  if (copyOnGen.value) {
    copyToClipboard()
  }
}

// Copy to clipboard
const copyToClipboard = async () => {
  if (!password.value) return

  try {
    await navigator.clipboard.writeText(password.value)
    copied.value = true
    navigator.vibrate?.(30)
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Auto-regenerate password when length changes
watch(passwordLength, generatePassword)
</script>

<template>
  <div class="password-gen">
    <h1 class="title text-6xl font-extrabold mb-10 text-center">PassGen</h1>

    <!-- Password Display -->
    <div @click="copyToClipboard" class="glass-panel password-display">
      <DecryptedText
        :key="password"
        :text="password || 'Click Generate'"
        :speed="30"
        :max-iterations="15"
        :sequential="true"
        reveal-direction="start"
        animate-on="view"
        class="password-text"
      />
      <span class="copy-hint" :class="{ copied: copied }">
        {{ copied ? 'Copied!' : 'Click to copy' }}
      </span>
    </div>

    <!-- Generate Button -->
    <button @click="generatePassword" class="glass-button">Generate Password</button>

    <!-- Options -->
    <div class="options-container">
      <!-- Length Slider -->
      <div class="glass-panel">
        <label class="option-label">Password Length</label>
        <ElasticSlider
          v-model:defaultValue="passwordLength"
          :starting-value="13"
          :max-value="24"
          :is-stepped="true"
          :step-size="1"
          class="mx-auto"
        />
      </div>

      <!-- Checkboxes -->
      <div class="glass-panel checkbox-group">
        <label class="checkbox-label">
          <input v-model="includeUppercase" type="checkbox" class="checkbox-input" />
          <span>Include Uppercase Letters</span>
        </label>

        <label class="checkbox-label">
          <input v-model="includeNumbers" type="checkbox" class="checkbox-input" />
          <span>Include Numbers</span>
        </label>

        <label class="checkbox-label">
          <input v-model="includeSpecialChars" type="checkbox" class="checkbox-input" />
          <span>Include Special Characters</span>
        </label>

        <label class="checkbox-label">
          <input v-model="noNumberFirstLast" type="checkbox" class="checkbox-input" />
          <span>First & Last Character Can't Be a Number</span>
        </label>

        <label class="checkbox-label">
          <input v-model="copyOnGen" type="checkbox" class="checkbox-input" />
          <span>Copy Password on Generation</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-gen {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  padding: 1.5rem;
  font-weight: 600;
}

.title {
  color: #ffffff;
  font-family: 'Tanker-Regular', sans-serif;
}

/* Glass panel base style */
.glass-panel {
  background: hsla(0, 0%, 100%, 0.1);
  backdrop-filter: blur(0.75em);
  -webkit-backdrop-filter: blur(0.75em);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow:
    0 0 0 1px hsla(0, 0%, 100%, 0.2) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.2);
  transition: all 0.3s ease;
}

.glass-panel:hover {
  background: hsla(0, 0%, 100%, 0.15);
  box-shadow:
    0 0 0 1px hsla(0, 0%, 100%, 0.3) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.25);
}

/* Password display */
.password-display {
  position: relative;
  margin-bottom: 1rem;
  cursor: pointer;
  user-select: none;
}

.password-text {
  font-size: 1.25rem;
  font-family: monospace;
  text-align: center;
  color: #ffffff;
  word-break: break-all;
}

.copy-hint {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  font-size: 0.75rem;
  color: hsla(0, 0%, 100%, 0.6);
  transition: color 0.3s ease;
}

.copy-hint.copied {
  color: #27ff64;
}

/* Generate button */
.glass-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, hsla(142, 100%, 58%, 0.3), hsla(142, 100%, 58%, 0.15));
  backdrop-filter: blur(0.75em);
  -webkit-backdrop-filter: blur(0.75em);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow:
    0 0 0 1px hsla(142, 100%, 58%, 0.4) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.2);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: linear-gradient(135deg, hsla(142, 100%, 58%, 0.4), hsla(142, 100%, 58%, 0.25));
  box-shadow:
    0 0 0 1px hsla(142, 100%, 58%, 0.6) inset,
    0 8px 32px hsla(0, 0%, 0%, 0.3);
  transform: translateY(-2px);
}

/* Options container */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-label {
  display: block;
  text-align: center;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: hsla(0, 0%, 100%, 0.9);
  transition: color 0.2s ease;
}

.checkbox-label:hover {
  color: #ffffff;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #27ff64;
  cursor: pointer;
}
</style>
