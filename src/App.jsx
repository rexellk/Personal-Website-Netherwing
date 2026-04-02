import './App.css'
import { useState, useEffect, useRef } from 'react'
import DragonScene from './components/DragonScene'
import VignetteOverlay from './components/VignetteOverlay'
import RiftCanvas from './components/RiftCanvas'
import ClawScene from './components/ClawScene'
import Portfolio from './web_components/Portfolio'

const ANIMATION_MS = 5000
const FLASH_DURATION = 550

export default function App() {
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const triggered = useRef(false)

  // Use Web Audio API — stays unlocked after any pointer gesture
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)

  useEffect(() => {
    const unlock = async () => {
      window.removeEventListener('pointerdown', unlock)
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      try {
        const res = await fetch('/Netherwing-Intro.mp3')
        const arr = await res.arrayBuffer()
        audioBufferRef.current = await ctx.decodeAudioData(arr)
      } catch (err) {
        console.error('audio load error:', err)
      }
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Wait for DragonScene to finish loading the GLB before allowing scroll trigger
  useEffect(() => {
    window.addEventListener('dragonReady', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Short delay so scroll finishes before enabling the trigger
      setTimeout(() => setModelReady(true), 600)
    }, { once: true })
  }, [])

  useEffect(() => {
    function onWheel(e) {
      if (!modelReady || triggered.current || e.deltaY <= 0) return
      e.preventDefault()
      triggered.current = true

      document.body.style.overflow = 'hidden'
      setAnimating(true)
      window.dispatchEvent(new CustomEvent('riftTrigger'))
      window.startDragonAnimation?.()

      if (audioCtxRef.current && audioBufferRef.current) {
        const src = audioCtxRef.current.createBufferSource()
        src.buffer = audioBufferRef.current
        src.connect(audioCtxRef.current.destination)
        const AUDIO_DELAY_MS = 700  // ← change this to delay the sound start (milliseconds)
        src.start(audioCtxRef.current.currentTime + AUDIO_DELAY_MS / 1000)
      } else {
        console.warn('audio not ready — pointerdown not received yet')
      }

      setTimeout(() => {
        setAnimating(false)
        setFlashing(true)

        setTimeout(() => {
          if (window.hideDragon) window.hideDragon()
          window.dispatchEvent(new CustomEvent('riftFlashDone'))
          document.body.style.overflow = ''
        }, FLASH_DURATION * 0.08)

        setTimeout(() => setFlashing(false), FLASH_DURATION)
      }, ANIMATION_MS)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [modelReady])

  return (
    <main style={{ background: '#000' }}>
      <RiftCanvas />
      <VignetteOverlay />
      <DragonScene />
      {animating && <ClawScene />}

      <Portfolio modelReady={modelReady} />

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
