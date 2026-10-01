import { useEffect, useRef } from 'react'
import { mountIntro } from '../intro/netherwingIntro'
import { cappedPixelRatio } from './viewport'

// The dragon intro cinematic (src/intro/netherwingIntro.js): one WebGL scene with the rift,
// the dragon and all post-processing. Replaces the old DragonScene + RiftCanvas + ClawScene +
// RiftParticles + VignetteOverlay layers, and keeps their contract with the rest of the app:
//   - fires `dragonReady` once the model is loaded (App then enables the scroll trigger)
//   - exposes `window.startDragonAnimation()` (App calls it on the first scroll)
//   - fires `dragonSceneDone` when the cinematic has finished
// It stays mounted behind the portfolio afterwards as the living rift background.
export default function IntroCinematic() {
  const stageRef = useRef(null)

  useEffect(() => {
    let intro = null
    let cancelled = false
    const base = import.meta.env.BASE_URL
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    mountIntro(stageRef.current, {
      assetBase: `${base}intro/`,
      dracoPath: `${base}draco/`,
      maxPixelRatio: cappedPixelRatio(),
      // once the portfolio has scrolled well past the hero, the rift is covered: skip rendering
      shouldRender: () => window.scrollY < window.innerHeight * 1.6,
    }).then((i) => {
      if (cancelled) { i.dispose(); return }
      intro = i
      i.onDone(() => window.dispatchEvent(new CustomEvent('dragonSceneDone')))
      window.startDragonAnimation = reducedMotion
        ? () => i.setT(i.DURATION)   // reduced motion: jump straight to the final frame
        : () => i.play()
      window.dispatchEvent(new CustomEvent('dragonReady'))
    }).catch((err) => console.error('intro load error:', err))

    return () => {
      cancelled = true
      intro?.dispose()
      delete window.startDragonAnimation
    }
  }, [])

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000', overflow: 'hidden' }}
    />
  )
}
