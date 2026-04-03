import './App.css'
import { useState, useEffect, useRef } from 'react'
import DragonScene from './components/DragonScene'
import VignetteOverlay from './components/VignetteOverlay'
import RiftCanvas from './components/RiftCanvas'
import ClawScene from './components/ClawScene'
import RiftParticles from './components/RiftParticles'
import Portfolio from './web_components/Portfolio'
import DragonFly from './components/DragonFly'
import DragonFly_2 from './components/DragonFly_2'

const ANIMATION_MS = 5000
const FLASH_DURATION = 550
const AMBIENT_MAX_VOLUME  = 0.3   // full volume when at hero (0.0–1.0)
const CROSSFADE_DURATION  = 1.0   // seconds for intro → ambient crossfade
const SCROLL_FADE_RANGE   = 2000  // scrollY (px) at which ambient is fully silent

export default function App() {
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const triggered = useRef(false)
  const audioUnlocked = useRef(false)

  // Track whether the user clicked before scrolling
  useEffect(() => {
    const onPointer = () => { audioUnlocked.current = true }
    window.addEventListener('pointerdown', onPointer, { once: true })
    return () => window.removeEventListener('pointerdown', onPointer)
  }, [])

  // Create AudioContext + fetch buffer immediately on mount
  // resume() inside the wheel handler — wheel is a trusted gesture
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)
  const ambientBufferRef = useRef(null)
  const ambientGainRef = useRef(null)

  useEffect(() => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    fetch('/Netherwing-Intro-2.mp3')
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { audioBufferRef.current = buf })
      .catch(err => console.error('audio load error:', err))

    fetch('/NetherRealm-Ambient.wav')
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { ambientBufferRef.current = buf })
      .catch(err => console.error('ambient load error:', err))
  }, [])

  // Scroll-based ambient volume
  useEffect(() => {
    function onScroll() {
      const gain = ambientGainRef.current
      if (!gain) return
      const t = Math.min(1, window.scrollY / SCROLL_FADE_RANGE)
      gain.gain.value = AMBIENT_MAX_VOLUME * (1 - t)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
    window.addEventListener('dragonRoarReady', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setModelReady(true), 600)
    }, { once: true })
  }, [])

  useEffect(() => {
    window.addEventListener('dragonFly2Ready', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      

      if (!audioUnlocked.current) {
        window.audioMuted = true
      }

      if (!window.audioMuted && audioCtxRef.current && audioBufferRef.current) {
        const ctx = audioCtxRef.current
        const AUDIO_DELAY_MS = 700
        const play = () => {
          const src = ctx.createBufferSource()
          src.buffer = audioBufferRef.current
          const gain = ctx.createGain()
          gain.gain.value = 0.4  // ← 0.0 = silent, 1.0 = full volume
          src.connect(gain)
          gain.connect(ctx.destination)
          const startAt = ctx.currentTime + AUDIO_DELAY_MS / 1000
          src.start(startAt)

          // When intro ends, crossfade into looping ambient
          src.onended = () => {
            if (window.audioMuted || !ambientBufferRef.current) return
            const ambientGain = ctx.createGain()
            ambientGain.gain.setValueAtTime(0, ctx.currentTime)
            ambientGain.gain.linearRampToValueAtTime(AMBIENT_MAX_VOLUME, ctx.currentTime + CROSSFADE_DURATION)
            ambientGain.connect(ctx.destination)
            ambientGainRef.current = ambientGain

            const ambient = ctx.createBufferSource()
            ambient.buffer = ambientBufferRef.current
            ambient.loop = true
            ambient.connect(ambientGain)
            ambient.start()
          }
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
          if (window.hideDragonRoar) window.hideDragonRoar()
          window.dispatchEvent(new CustomEvent('riftFlashDone'))
          document.body.style.overflow = ''
        }, FLASH_DURATION * 0.08)

        setTimeout(() => setFlashing(false), FLASH_DURATION)
        document.body.style.overflow = ''
      }, ANIMATION_MS)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [modelReady])

  return (
    <main style={{ background: '#000' }}>
      <DragonFly/>
      <DragonFly_2/>
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