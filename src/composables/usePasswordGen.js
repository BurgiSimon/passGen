import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { buildPool, generate, clampLength, DEFAULT_LENGTH } from '@/lib/passwordCore'

const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function usePasswordGen() {
  const password = ref('')
  const copied = ref(false)
  const passwordLength = ref(DEFAULT_LENGTH)
  const includeUppercase = ref(true)
  const includeNumbers = ref(true)
  const includeSpecialChars = ref(false)
  const noNumberFirstLast = ref(true)

  const charPool = computed(() =>
    buildPool({
      uppercase: includeUppercase.value,
      numbers: includeNumbers.value,
      special: includeSpecialChars.value,
    }),
  )

  const loadPreferences = () => {
    const uppercase = getCookie('pg_uppercase')
    const numbers = getCookie('pg_numbers')
    const special = getCookie('pg_special')
    const noNumFirstLast = getCookie('pg_noNumFirstLast')
    const length = getCookie('pg_length')

    if (uppercase !== null) includeUppercase.value = uppercase === 'true'
    if (numbers !== null) includeNumbers.value = numbers === 'true'
    if (special !== null) includeSpecialChars.value = special === 'true'
    if (noNumFirstLast !== null) noNumberFirstLast.value = noNumFirstLast === 'true'
    if (length !== null) passwordLength.value = clampLength(length)
  }

  const savePreferences = () => {
    setCookie('pg_uppercase', includeUppercase.value)
    setCookie('pg_numbers', includeNumbers.value)
    setCookie('pg_special', includeSpecialChars.value)
    setCookie('pg_noNumFirstLast', noNumberFirstLast.value)
    setCookie('pg_length', passwordLength.value)
  }

  const generatePassword = () => {
    copied.value = false
    navigator.vibrate?.(50)
    password.value = generate({
      length: passwordLength.value,
      uppercase: includeUppercase.value,
      numbers: includeNumbers.value,
      special: includeSpecialChars.value,
      noNumberFirstLast: noNumberFirstLast.value,
    })
  }

  let copyTimer = null

  const copyToClipboard = async () => {
    if (!password.value) return
    try {
      await navigator.clipboard.writeText(password.value)
      copied.value = true
      navigator.vibrate?.(30)
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleKeydown = (e) => {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.target.isContentEditable) return
    // Don't hijack Ctrl+C / Cmd+C / Alt+C.
    if (e.ctrlKey || e.metaKey || e.altKey) return

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      generatePassword()
    }

    if (e.key === 'c' && password.value) {
      e.preventDefault()
      copyToClipboard()
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    clearTimeout(copyTimer)
  })

  // Preferences load synchronously so the very first password honors them.
  loadPreferences()
  generatePassword()

  watch(passwordLength, generatePassword)
  watch(
    [includeUppercase, includeNumbers, includeSpecialChars, noNumberFirstLast, passwordLength],
    savePreferences,
  )

  return {
    password,
    copied,
    passwordLength,
    includeUppercase,
    includeNumbers,
    includeSpecialChars,
    noNumberFirstLast,
    charPool,
    generatePassword,
    copyToClipboard,
  }
}
