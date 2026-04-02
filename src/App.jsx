import './App.css'
import { useState, useEffect, useRef } from 'react'
import DragonScene from './components/DragonScene'
import VignetteOverlay from './components/VignetteOverlay'
import RiftCanvas from './components/RiftCanvas'
import ClawScene from './components/ClawScene'
import RiftParticles from './components/RiftParticles'
import Portfolio from './web_components/Portfolio'

const ANIMATION_MS = 5000
const FLASH_DURATION = 550

export default function App() {
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const triggered = useRef(false)

  // Create AudioContext + fetch buffer immediately on mount
  // resume() inside the wheel handler — wheel is a trusted gesture
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)

  useEffect(() => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    fetch('/Netherwing-Intro.mp3')
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { audioBufferRef.current = buf })
      .catch(err => console.error('audio load error:', err))
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
        const ctx = audioCtxRef.current
        const AUDIO_DELAY_MS = 700
        const play = () => {
          const src = ctx.createBufferSource()
          src.buffer = audioBufferRef.current
          const gain = ctx.createGain()
          gain.gain.value = 0.3  // ← 0.0 = silent, 1.0 = full volume
          src.connect(gain)
          gain.connect(ctx.destination)
          src.start(ctx.currentTime + AUDIO_DELAY_MS / 1000)
        }
        // resume() unlocks the context from within the wheel gesture
        if (ctx.state === 'suspended') {
          ctx.resume().then(play)
        } else {
          play()
        }
      }

      setTimeout(() => {
        setAnimating(false)
        setFlashing(true)

        setTimeout(() => {
          // Freeze rift at fully-open dragonTime before hiding dragon
          window.riftFrozenTime = window.primaryDragonAction?.time ?? 5.0
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
      {animating && <RiftParticles />}

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
