import { ref, watch } from 'vue'
import { setCookie, getEnum } from '@/lib/cookies'

export const THEMES = ['system', 'dark', 'light']

// 'system' leaves the decision to prefers-color-scheme; the other two pin it.
export function useTheme() {
  const theme = ref(getEnum('pg_theme', THEMES, 'system'))

  const apply = () => {
    const root = document.documentElement
    if (theme.value === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme.value)
  }

  const cycleTheme = () => {
    theme.value = THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length]
  }

  watch(theme, () => {
    apply()
    setCookie('pg_theme', theme.value)
  })

  apply()

  return { theme, cycleTheme }
}
