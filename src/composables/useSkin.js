import { ref, watch } from 'vue'
import { setCookie, getEnum } from '@/lib/cookies'

// 'glass' is the original look; 'terminal' is the brutalist redesign.
// Only one view mounts at a time, so each owns its own usePasswordGen() state.
export const SKINS = ['glass', 'terminal']

export function useSkin() {
  const skin = ref(getEnum('pg_skin', SKINS, 'glass'))

  const toggleSkin = () => {
    skin.value = skin.value === 'glass' ? 'terminal' : 'glass'
  }

  watch(skin, () => setCookie('pg_skin', skin.value))

  return { skin, toggleSkin }
}
