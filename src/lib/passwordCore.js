// Pure password generation. No Vue, no DOM — assertable by a plain node script.

import { WORDS } from './wordlist'

export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const NUMBERS = '0123456789'
export const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export const MIN_LENGTH = 13
export const MAX_LENGTH = 24
export const DEFAULT_LENGTH = 16

export const MIN_WORDS = 3
export const MAX_WORDS = 8
export const DEFAULT_WORDS = 5
export const SEPARATORS = ['-', '.', '_', ' ']

export const MODES = ['random', 'passphrase']

// Lowercase is unconditional, so the pool is never empty.
export const buildPool = ({ uppercase, numbers, special }) =>
  LOWERCASE + (uppercase ? UPPERCASE : '') + (numbers ? NUMBERS : '') + (special ? SPECIAL : '')

export const buildNonNumberPool = ({ uppercase, special }) =>
  buildPool({ uppercase, numbers: false, special })

// CSPRNG with rejection sampling — discard draws above the largest multiple of n
// so every index stays equally likely.
export const randomIndex = (n) => {
  const limit = Math.floor(2 ** 32 / n) * n
  const buf = new Uint32Array(1)
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return buf[0] % n
}

export const randomChar = (pool) => pool[randomIndex(pool.length)]

// No "at least one of each set" guarantee — deliberate, it would skew the distribution.
export const generate = ({ length, uppercase, numbers, special, noNumberFirstLast }) => {
  if (length <= 0) return ''
  const pool = buildPool({ uppercase, numbers, special })

  if (noNumberFirstLast && length >= 2) {
    const edgePool = buildNonNumberPool({ uppercase, special })
    let out = randomChar(edgePool)
    for (let i = 1; i < length - 1; i++) out += randomChar(pool)
    return out + randomChar(edgePool)
  }

  let out = ''
  for (let i = 0; i < length; i++) out += randomChar(pool)
  return out
}

export const generatePassphrase = ({ words, separator, capitalize, appendDigit }) => {
  const n = clampWords(words)
  const sep = SEPARATORS.includes(separator) ? separator : SEPARATORS[0]
  const picked = Array.from({ length: n }, () => WORDS[randomIndex(WORDS.length)])
  const out = picked.map((w) => (capitalize ? w[0].toUpperCase() + w.slice(1) : w)).join(sep)
  return appendDigit ? out + sep + randomChar(NUMBERS) : out
}

// Bits of entropy in the *generator*, not in the string it happened to produce.
// Capitalising every word is deterministic and adds nothing.
export const entropyBits = (o) => {
  if (o.mode === 'passphrase') {
    return clampWords(o.words) * Math.log2(WORDS.length) + (o.appendDigit ? Math.log2(10) : 0)
  }
  if (o.length <= 0) return 0
  const pool = buildPool(o).length
  if (o.noNumberFirstLast && o.length >= 2) {
    const edge = buildNonNumberPool(o).length
    return 2 * Math.log2(edge) + (o.length - 2) * Math.log2(pool)
  }
  return o.length * Math.log2(pool)
}

export const strengthLabel = (bits) =>
  bits < 50 ? 'weak' : bits < 70 ? 'fair' : bits < 100 ? 'strong' : 'excellent'

// pg_* values come from user-editable cookies — a trust boundary.
const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export const clampLength = (value) => clampInt(value, MIN_LENGTH, MAX_LENGTH, DEFAULT_LENGTH)
export const clampWords = (value) => clampInt(value, MIN_WORDS, MAX_WORDS, DEFAULT_WORDS)
