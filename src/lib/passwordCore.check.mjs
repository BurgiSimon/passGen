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
} from './passwordCore.js'

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

console.log(`ok — ${n} assertions`)
