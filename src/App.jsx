import './App.css'
import { useState, useEffect, useRef } from 'react'
import LoadingScreen from './components/LoadingScreen'
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
const AMBIENT_MAX_VOLUME  = 0.05   // full volume when at hero (0.0–1.0)
const CROSSFADE_DURATION  = 5.0   // seconds for the overlap crossfade
const CROSSFADE_OVERLAP   = 5.0   // seconds before intro ends to start ambient
const SCROLL_FADE_RANGE   = 2000  // scrollY (px) at which ambient is fully silent

export default function App() {
  const [booting, setBooting] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const triggered = useRef(false)
  const masterGainRef = useRef(null)

  // Sync mute state to all audio
  useEffect(() => {
    window.audioMuted = muted
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = muted ? 0 : 1
    }
  }, [muted])

  // Create AudioContext + fetch buffer immediately on mount
  // resume() inside the wheel handler — wheel is a trusted gesture
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)
  const ambientBufferRef = useRef(null)
  const ambientGainRef = useRef(null)

  useEffect(() => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    fetch(`${import.meta.env.BASE_URL}Netherwing-Intro-2.mp3`)
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { audioBufferRef.current = buf })
      .catch(err => console.error('audio load error:', err))

    fetch(`${import.meta.env.BASE_URL}NetherRealm-Ambient.wav`)
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

  // Lock scroll from page load — unlocked after flash completes
  useEffect(() => {
    document.body.style.overflow = 'hidden'
  }, [])

  // Only dragonReady (DragonScene GLB) gates the scroll trigger —
  // dragonRoarReady/dragonFly2Ready fire independently and must not unblock scroll early
  useEffect(() => {
    window.addEventListener('dragonReady', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setModelReady(true), 600)
    }, { once: true })
  }, [])

  useEffect(() => {
    function onWheel(e) {
      if (!modelReady || triggered.current || e.deltaY <= 0) return
      e.preventDefault()
      triggered.current = true

      console.log("startDragonAnimation exists?", !!window.startDragonAnimation)

      document.body.style.overflow = 'hidden'
      setAnimating(true)
      window.dispatchEvent(new CustomEvent('riftTrigger'))

      if (audioCtxRef.current && audioBufferRef.current) {
        const ctx = audioCtxRef.current

        // Create master gain once and store it for mute control
        if (!masterGainRef.current) {
          const master = ctx.createGain()
          master.gain.value = window.audioMuted ? 0 : 1
          master.connect(ctx.destination)
          masterGainRef.current = master
        }

        const AUDIO_DELAY_MS = 700
        const play = () => {
          const src = ctx.createBufferSource()
          src.buffer = audioBufferRef.current
          const gain = ctx.createGain()
          gain.gain.value = 0.4  // ← 0.0 = silent, 1.0 = full volume
          src.connect(gain)
          gain.connect(masterGainRef.current)
          const startAt = ctx.currentTime + AUDIO_DELAY_MS / 1000
          src.start(startAt)

          // Schedule ambient to start CROSSFADE_OVERLAP seconds before intro ends,
          // fading in while intro fades out simultaneously
          const introDuration = audioBufferRef.current.duration
          const crossfadeAt = startAt + introDuration - CROSSFADE_OVERLAP

          if (ambientBufferRef.current && crossfadeAt > ctx.currentTime) {
            // Fade out intro
            gain.gain.setValueAtTime(0.4, crossfadeAt)
            gain.gain.linearRampToValueAtTime(0, crossfadeAt + CROSSFADE_DURATION)

            // Fade in ambient
            const ambientGain = ctx.createGain()
            ambientGain.gain.setValueAtTime(0, crossfadeAt)
            ambientGain.gain.linearRampToValueAtTime(AMBIENT_MAX_VOLUME, crossfadeAt + CROSSFADE_DURATION)
            ambientGain.connect(masterGainRef.current)
            ambientGainRef.current = ambientGain

            const ambient = ctx.createBufferSource()
            ambient.buffer = ambientBufferRef.current
            ambient.loop = true
            ambient.connect(ambientGain)
            ambient.start(crossfadeAt)
          }
        }
        // resume() unlocks the context from within the wheel gesture
        if (ctx.state === 'suspended') {
          ctx.resume().then(play)
        } else {
          play()
        }
      }

      // Poll until DragonScene GLB is ready, then start animation + 5s timer together
      const waitForDragon = setInterval(() => {
        if (!window.startDragonAnimation) return
        clearInterval(waitForDragon)
        window.startDragonAnimation()

        setTimeout(() => {
          setAnimating(false)
          setFlashing(true)

          setTimeout(() => {
            window.riftFrozenTime = window.primaryDragonAction?.time ?? 5.0
            if (window.hideDragon) window.hideDragon()
            if (window.hideDragonRoar) window.hideDragonRoar()
            window.dispatchEvent(new CustomEvent('riftFlashDone'))
            document.body.style.overflow = ''
          }, FLASH_DURATION * 0.08)

          setTimeout(() => setFlashing(false), FLASH_DURATION)
          document.body.style.overflow = ''
        }, ANIMATION_MS)
      }, 50)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [modelReady])

  return (
    <main style={{ background: '#000' }}>
      {booting && <LoadingScreen onComplete={() => setBooting(false)} />}
      <DragonFly/>
      <DragonFly_2/>
      <RiftCanvas />
      <VignetteOverlay />
      <DragonScene />
      {animating && <ClawScene />}
      {animating && <RiftParticles />}

      <Portfolio modelReady={modelReady} muted={muted} setMuted={setMuted} />

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