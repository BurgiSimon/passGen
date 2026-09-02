import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { setCookie, getCookie, getBool, getEnum } from '@/lib/cookies'
import {
  buildPool,
  generate,
  generatePassphrase,
  clampLength,
  clampWords,
  DEFAULT_LENGTH,
  DEFAULT_WORDS,
  SEPARATORS,
  MODES,
} from '@/lib/passwordCore'
import { WORDS } from '@/lib/wordlist'

// History is deliberately in-memory only. Persisting generated passwords to
// cookies or localStorage would leave plaintext secrets on disk for any script
// on the origin to read; the list dies with the tab.
const HISTORY_MAX = 10

export function usePasswordGen() {
  const password = ref('')
  const lastCopied = ref('')
  const history = ref([])

  const mode = ref(MODES[0])

  const passwordLength = ref(DEFAULT_LENGTH)
  const includeUppercase = ref(true)
  const includeNumbers = ref(true)
  const includeSpecialChars = ref(false)
  const noNumberFirstLast = ref(true)

  const wordCount = ref(DEFAULT_WORDS)
  const separator = ref(SEPARATORS[0])
  const capitalize = ref(false)
  const appendDigit = ref(false)

  const isPassphrase = computed(() => mode.value === 'passphrase')

  const options = computed(() => ({
    mode: mode.value,
    length: passwordLength.value,
    uppercase: includeUppercase.value,
    numbers: includeNumbers.value,
    special: includeSpecialChars.value,
    noNumberFirstLast: noNumberFirstLast.value,
    words: wordCount.value,
    separator: separator.value,
    capitalize: capitalize.value,
    appendDigit: appendDigit.value,
  }))

  // Alphabet for the reveal animation only — never a source of password material.
  const charPool = computed(() =>
    isPassphrase.value ? 'abcdefghijklmnopqrstuvwxyz' + separator.value : buildPool(options.value),
  )

  const detail = computed(() =>
    isPassphrase.value
      ? `${clampWords(wordCount.value)} words · list ${WORDS.length}`
      : `${password.value.length} chars · pool ${buildPool(options.value).length}`,
  )

  const copied = computed(() => lastCopied.value !== '' && lastCopied.value === password.value)

  const loadPreferences = () => {
    mode.value = getEnum('pg_mode', MODES, mode.value)

    includeUppercase.value = getBool('pg_uppercase', includeUppercase.value)
    includeNumbers.value = getBool('pg_numbers', includeNumbers.value)
    includeSpecialChars.value = getBool('pg_special', includeSpecialChars.value)
    noNumberFirstLast.value = getBool('pg_noNumFirstLast', noNumberFirstLast.value)
    const length = getCookie('pg_length')
    if (length !== null) passwordLength.value = clampLength(length)

    const words = getCookie('pg_words')
    if (words !== null) wordCount.value = clampWords(words)
    separator.value = getEnum('pg_sep', SEPARATORS, separator.value)
    capitalize.value = getBool('pg_caps', capitalize.value)
    appendDigit.value = getBool('pg_digit', appendDigit.value)
  }

  const savePreferences = () => {
    setCookie('pg_mode', mode.value)
    setCookie('pg_uppercase', includeUppercase.value)
    setCookie('pg_numbers', includeNumbers.value)
    setCookie('pg_special', includeSpecialChars.value)
    setCookie('pg_noNumFirstLast', noNumberFirstLast.value)
    setCookie('pg_length', passwordLength.value)
    setCookie('pg_words', wordCount.value)
    setCookie('pg_sep', separator.value)
    setCookie('pg_caps', capitalize.value)
    setCookie('pg_digit', appendDigit.value)
  }

  const generatePassword = () => {
    lastCopied.value = ''
    navigator.vibrate?.(50)

    // The outgoing password moves to history; the current one is never listed twice.
    if (password.value) {
      history.value = [password.value, ...history.value].slice(0, HISTORY_MAX)
    }

    password.value = isPassphrase.value
      ? generatePassphrase(options.value)
      : generate(options.value)
  }

  const clearHistory = () => {
    history.value = []
  }

  let copyTimer = null

  const copyToClipboard = async (text = password.value) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      lastCopied.value = text
      navigator.vibrate?.(30)
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        lastCopied.value = ''
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleKeydown = (e) => {
    // Any focused control keeps its own keys. Guarding only on INPUT/TEXTAREA/
    // SELECT meant Enter and Space on a focused button were preventDefault'd
    // here, so buttons could be tabbed to but never activated from the keyboard.
    if (e.target.closest?.('button, a[href], input, textarea, select, [role="button"]')) return
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

  // Switching mode or any size knob produces a fresh result immediately;
  // the character-set toggles stay manual, as they always have.
  watch([mode, passwordLength, wordCount, separator, capitalize, appendDigit], generatePassword)
  watch(
    [
      mode,
      includeUppercase,
      includeNumbers,
      includeSpecialChars,
      noNumberFirstLast,
      passwordLength,
      wordCount,
      separator,
      capitalize,
      appendDigit,
    ],
    savePreferences,
  )

  return {
    password,
    copied,
    lastCopied,
    history,
    clearHistory,
    mode,
    isPassphrase,
    detail,
    passwordLength,
    includeUppercase,
    includeNumbers,
    includeSpecialChars,
    noNumberFirstLast,
    wordCount,
    separator,
    capitalize,
    appendDigit,
    charPool,
    generatePassword,
    copyToClipboard,
  }
}
