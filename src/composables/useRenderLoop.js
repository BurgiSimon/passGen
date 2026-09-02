import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Gating shared by the two decorative canvases, DotGrid and MetallicPaint.
 *
 * Both used to end their draw function with a bare `requestAnimationFrame`, so a
 * background effect kept a core busy for as long as the tab was open. On the
 * production build that cost 32s of total blocking time and a 44s time to
 * interactive on a page that paints in 0.7s.
 *
 * Three rules, all of them things a plain rAF loop cannot express:
 *   - `frame()` returning false parks the loop until something calls `wake()`.
 *     A static dot grid redraws an identical canvas 60 times a second otherwise.
 *   - Off-screen elements do not animate. The observer wakes them on re-entry.
 *   - Reduced motion gets exactly one frame, so the visual still renders — it
 *     just holds still. Rendering nothing would leave a blank canvas.
 *
 * Hidden tabs are deliberately not handled: browsers already stop firing rAF for
 * them, so a visibilitychange listener would be dead code.
 */
export function useRenderLoop(elRef, frame) {
  let rafId = 0
  let inView = true
  let observer = null
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  const tick = (time) => {
    rafId = 0
    // Reschedule only while the frame reports it still has work to do.
    if (frame(time) !== false && inView && !reduced.matches) {
      rafId = requestAnimationFrame(tick)
    }
  }

  const wake = () => {
    if (rafId || !inView) return
    rafId = requestAnimationFrame(tick)
  }

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  const onReducedChange = () => wake()

  onMounted(() => {
    const el = elRef.value
    if (el) {
      observer = new IntersectionObserver((entries) => {
        inView = entries[entries.length - 1].isIntersecting
        if (inView) wake()
        else stop()
      })
      observer.observe(el)
    }
    reduced.addEventListener('change', onReducedChange)
    wake()
  })

  onBeforeUnmount(() => {
    stop()
    observer?.disconnect()
    reduced.removeEventListener('change', onReducedChange)
  })

  return { wake, stop }
}
