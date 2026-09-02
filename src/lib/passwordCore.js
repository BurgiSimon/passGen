// Pure password generation. No Vue, no DOM — assertable by a plain node script.

export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const NUMBERS = '0123456789'
export const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export const MIN_LENGTH = 13
export const MAX_LENGTH = 24
export const DEFAULT_LENGTH = 16

// Lowercase is unconditional, so the pool is never empty.
export const buildPool = ({ uppercase, numbers, special }) =>
  LOWERCASE + (uppercase ? UPPERCASE : '') + (numbers ? NUMBERS : '') + (special ? SPECIAL : '')

export const buildNonNumberPool = ({ uppercase, special }) =>
  buildPool({ uppercase, numbers: false, special })

// CSPRNG with rejection sampling — discard draws above the largest multiple of pool.length
// so every character stays equally likely.
export const randomChar = (pool) => {
  const limit = Math.floor(2 ** 32 / pool.length) * pool.length
  const buf = new Uint32Array(1)
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return pool[buf[0] % pool.length]
}

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

// pg_length comes from a user-editable cookie — a trust boundary.
export const clampLength = (value) => {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return DEFAULT_LENGTH
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n))
}
