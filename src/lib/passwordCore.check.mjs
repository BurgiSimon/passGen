// Run: bun src/lib/passwordCore.check.mjs   (node works too)
import assert from 'node:assert'
import {
  LOWERCASE,
  UPPERCASE,
  NUMBERS,
  SPECIAL,
  buildPool,
  randomChar,
  generate,
  clampLength,
  clampWords,
  generatePassphrase,
  randomIndex,
  SEPARATORS,
  MIN_WORDS,
  MAX_WORDS,
} from './passwordCore.js'
import { WORDS } from './wordlist.js'

let n = 0
const ok = (cond, msg) => {
  n++
  assert.ok(cond, msg)
}
const eq = (a, b, msg) => {
  n++
  assert.strictEqual(a, b, msg)
}

const OPTS = { uppercase: true, numbers: true, special: true, noNumberFirstLast: false }

// length
for (const length of [13, 16, 24, 0, 1]) {
  eq(generate({ ...OPTS, length }).length, length, `length ${length}`)
}

// edge rule on
for (let i = 0; i < 3000; i++) {
  const p = generate({ ...OPTS, length: 13, noNumberFirstLast: true })
  ok(!NUMBERS.includes(p[0]) && !NUMBERS.includes(p[12]), `digit at edge: ${p}`)
}

// edge rule off — the flag must actually be doing something
let edgeDigits = 0
for (let i = 0; i < 3000; i++) {
  const p = generate({ ...OPTS, length: 13 })
  if (NUMBERS.includes(p[0]) || NUMBERS.includes(p[12])) edgeDigits++
}
ok(edgeDigits > 0, 'noNumberFirstLast:false never produced an edge digit — flag is a no-op')

// all optional sets off -> lowercase only
for (let i = 0; i < 200; i++) {
  const p = generate({ length: 16, uppercase: false, numbers: false, special: false })
  ok(
    [...p].every((c) => LOWERCASE.includes(c)),
    `not lowercase-only: ${p}`,
  )
}

// pool membership across all 8 flag combinations
for (let mask = 0; mask < 8; mask++) {
  const flags = { uppercase: !!(mask & 1), numbers: !!(mask & 2), special: !!(mask & 4) }
  const pool = buildPool(flags)
  for (const noNumberFirstLast of [false, true]) {
    for (let i = 0; i < 200; i++) {
      const p = generate({ ...flags, noNumberFirstLast, length: 24 })
      ok(
        [...p].every((c) => pool.includes(c)),
        `char outside pool (mask ${mask}): ${p}`,
      )
    }
  }
}

// full pool coverage — catches an off-by-one rejection bound silently truncating the pool
const pool62 = LOWERCASE + UPPERCASE + NUMBERS
const seen = new Set()
for (let i = 0; i < 20000; i++) seen.add(randomChar(pool62))
eq(seen.size, pool62.length, `only ${seen.size}/${pool62.length} pool chars drawn in 20k samples`)

// char sets verbatim
eq(SPECIAL, '!@#$%^&*()_+-=[]{}|;:,.<>?', 'SPECIAL drifted')
eq(buildPool({ uppercase: true, numbers: true, special: true }).length, 88, 'full pool size')

// clampLength — cookie trust boundary
eq(clampLength('abc'), 16, "clampLength('abc')")
eq(clampLength('500'), 24, "clampLength('500')")
eq(clampLength('1'), 13, "clampLength('1')")
eq(clampLength('18'), 18, "clampLength('18')")
eq(clampLength(undefined), 16, 'clampLength(undefined)')

// ---- wordlist ----
eq(WORDS.length, 1295, 'wordlist size — entropy per word depends on it')
eq(new Set(WORDS).size, 1295, 'wordlist has duplicates — that lowers real entropy')
ok(
  WORDS.every((w) => typeof w === 'string' && w.length > 0 && w === w.toLowerCase()),
  'wordlist entry is not a lowercase string',
)
// A word containing a separator makes the phrase ambiguous to read back.
ok(
  WORDS.every((w) => !SEPARATORS.some((s) => w.includes(s))),
  `word contains a separator: ${WORDS.filter((w) => SEPARATORS.some((s) => w.includes(s)))}`,
)

// ---- passphrase ----
const PP = { words: 5, separator: '-', capitalize: false, appendDigit: false }

for (const words of [MIN_WORDS, 5, MAX_WORDS]) {
  const p = generatePassphrase({ ...PP, words })
  eq(p.split('-').length, words, `passphrase word count ${words}`)
}

// clamped, not trusted
eq(generatePassphrase({ ...PP, words: 99 }).split('-').length, MAX_WORDS, 'words clamped high')
eq(generatePassphrase({ ...PP, words: 0 }).split('-').length, MIN_WORDS, 'words clamped low')
eq(generatePassphrase({ ...PP, words: 'abc' }).split('-').length, 5, 'words NaN -> default')

// unknown separator falls back rather than producing "undefined" glue
ok(!generatePassphrase({ ...PP, separator: '§' }).includes('undefined'), 'bad separator leaked')
eq(generatePassphrase({ ...PP, separator: '§' }).split('-').length, 5, 'bad separator -> default')

for (const separator of SEPARATORS) {
  const p = generatePassphrase({ ...PP, separator })
  eq(p.split(separator).length, 5, `separator ${JSON.stringify(separator)}`)
}

// every word actually comes from the list
for (let i = 0; i < 400; i++) {
  const parts = generatePassphrase(PP).split('-')
  ok(
    parts.every((w) => WORDS.includes(w)),
    `passphrase word off-list: ${parts}`,
  )
}

// capitalize is deterministic per word, so it must not change which words are possible
for (let i = 0; i < 200; i++) {
  const parts = generatePassphrase({ ...PP, capitalize: true }).split('-')
  ok(
    parts.every((w) => WORDS.includes(w[0].toLowerCase() + w.slice(1))),
    `capitalized word off-list: ${parts}`,
  )
  ok(
    parts.every((w) => w[0] === w[0].toUpperCase()),
    `capitalize did not apply: ${parts}`,
  )
}

// appended digit is a digit, and adds exactly one token
for (let i = 0; i < 200; i++) {
  const parts = generatePassphrase({ ...PP, appendDigit: true }).split('-')
  eq(parts.length, 6, 'appendDigit token count')
  ok(NUMBERS.includes(parts[5]), `appended token not a digit: ${parts[5]}`)
}

// wordlist coverage — an off-by-one in randomIndex would truncate the list
const idx = new Set()
for (let i = 0; i < 40000; i++) idx.add(randomIndex(WORDS.length))
eq(idx.size, WORDS.length, `only ${idx.size}/${WORDS.length} word indices drawn in 40k samples`)
ok(Math.min(...idx) === 0 && Math.max(...idx) === WORDS.length - 1, 'randomIndex range')

// clampWords — cookie trust boundary
eq(clampWords('abc'), 5, "clampWords('abc')")
eq(clampWords('99'), 8, "clampWords('99')")
eq(clampWords('1'), 3, "clampWords('1')")
eq(clampWords('7'), 7, "clampWords('7')")
eq(clampWords(undefined), 5, 'clampWords(undefined)')

console.log(`ok — ${n} assertions`)
