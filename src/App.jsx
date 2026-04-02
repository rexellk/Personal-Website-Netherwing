import './App.css'
import { useState, useEffect, useRef } from 'react'
import DragonScene from './components/DragonScene'
import VignetteOverlay from './components/VignetteOverlay'
import RiftCanvas from './components/RiftCanvas'
import ClawScene from './components/ClawScene'
import Portfolio from './web_components/Portfolio'

const ANIMATION_MS = 5000   // when dragon finishes
const FLASH_DURATION = 550  // total flash overlay duration (ms)

export default function App() {
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const triggered = useRef(false)

  useEffect(() => {
    function onWheel(e) {
      if (triggered.current || e.deltaY <= 0) return
      e.preventDefault()
      triggered.current = true

      document.body.style.overflow = 'hidden'
      setAnimating(true)
      window.dispatchEvent(new CustomEvent('riftTrigger'))

      // Start dragon — if model not loaded yet, flag it for when it is
      if (window.startDragonAnimation) {
        window.startDragonAnimation()
      } else {
        window.riftPendingStart = true
      }

      setTimeout(() => {
        // Dragon done — flash
        setAnimating(false)
        setFlashing(true)

        // At peak of flash: hide dragon + restore hero text behind the white-out
        setTimeout(() => {
          if (window.hideDragon) window.hideDragon()
          window.dispatchEvent(new CustomEvent('riftFlashDone'))
          document.body.style.overflow = ''
        }, FLASH_DURATION * 0.08)

        // Flash div unmounts after animation
        setTimeout(() => setFlashing(false), FLASH_DURATION)

      }, ANIMATION_MS)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <main style={{ background: '#000' }}>
      {/* Rift stays permanently — ambient void background */}
      <RiftCanvas />
      <VignetteOverlay />

      {/* DragonScene always mounted — stars + butterflies always visible */}
      <DragonScene />
      {animating && <ClawScene />}

      <Portfolio />

      {flashing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, #ffffff 0%, #cc33ff 35%, #4400cc 75%, #000 100%)',
            animation: `purpleFlash ${FLASH_DURATION}ms ease-out forwards`,
          }}
        />
      )}
    </main>
  )
}
