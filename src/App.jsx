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
const AMBIENT_VOLUME  = 0.3   // ambient track volume (0.0–1.0)
const CROSSFADE_DURATION  = 5.0   // seconds for the overlap crossfade
const CROSSFADE_OVERLAP   = 5.0   // seconds before intro ends to start ambient


// Start the soundtrack in sync with the intro, from however far in we already are.
// A wheel scroll isn't a user-activation gesture, so the AudioContext can still be
// suspended when the intro starts; the first click (e.g. the sound button) resumes it
// and this picks the music up at the right offset instead of never starting.
function startMusic(r) {
  const ctx = r.audioCtxRef.current
  if (!ctx || ctx.state !== 'running' || r.musicStartedRef.current) return
  if (r.triggerTimeRef.current === null || !r.audioBufferRef.current) return
  r.musicStartedRef.current = true

  if (!r.masterGainRef.current) {
    const master = ctx.createGain()
    master.gain.value = window.audioMuted ? 0 : 1
    master.connect(ctx.destination)
    r.masterGainRef.current = master
  }

  const AUDIO_DELAY = 0.7
  const introDuration = r.audioBufferRef.current.duration
  // Seconds into the intro track we should be right now (negative = not started yet)
  const offset = (performance.now() - r.triggerTimeRef.current) / 1000 - AUDIO_DELAY
  const introStartAt = ctx.currentTime - offset  // virtual start time of the intro
  const crossfadeAt = introStartAt + introDuration - CROSSFADE_OVERLAP

  if (offset < introDuration - CROSSFADE_OVERLAP) {
    const src = ctx.createBufferSource()
    src.buffer = r.audioBufferRef.current
    const gain = ctx.createGain()
    gain.gain.value = 0.6  // ← 0.0 = silent, 1.0 = full volume
    src.connect(gain)
    gain.connect(r.masterGainRef.current)
    if (offset < 0) src.start(introStartAt)
    else src.start(ctx.currentTime, offset)

    if (r.ambientBufferRef.current) {
      // Fade out intro while ambient fades in, CROSSFADE_OVERLAP s before intro ends
      gain.gain.setValueAtTime(0.4, crossfadeAt)
      gain.gain.linearRampToValueAtTime(0, crossfadeAt + CROSSFADE_DURATION)
      startAmbient(r, crossfadeAt, CROSSFADE_DURATION)
    }
  } else if (r.ambientBufferRef.current) {
    // Intro is (nearly) over — go straight to the looping background track
    startAmbient(r, ctx.currentTime, 2.0)
  }
}

function startAmbient(r, at, fadeSeconds) {
  const ctx = r.audioCtxRef.current
  const ambientGain = ctx.createGain()
  ambientGain.gain.setValueAtTime(0, at)
  ambientGain.gain.linearRampToValueAtTime(AMBIENT_VOLUME, at + fadeSeconds)
  ambientGain.connect(r.masterGainRef.current)
  r.ambientGainRef.current = ambientGain

  const ambient = ctx.createBufferSource()
  ambient.buffer = r.ambientBufferRef.current
  ambient.loop = true
  ambient.connect(ambientGain)
  ambient.start(at)
}


function DesktopApp() {
  const [booting, setBooting] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const triggered = useRef(false)
  const masterGainRef = useRef(null)


  // Create AudioContext + fetch buffer immediately on mount
  // resume() inside the wheel handler — wheel is a trusted gesture
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)
  const ambientBufferRef = useRef(null)
  const ambientGainRef = useRef(null)
  const triggerTimeRef = useRef(null)   // performance.now() when the intro was triggered
  const musicStartedRef = useRef(false) // guards against starting the soundtrack twice

  // Sync mute state to all audio. Unmuting is a click, which is a real user
  // gesture, so it's also where a still-suspended AudioContext gets resumed.
  useEffect(() => {
    window.audioMuted = muted
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = muted ? 0 : 1
    }
    const ctx = audioCtxRef.current
    if (!muted && ctx) {
      const r = { audioCtxRef, audioBufferRef, ambientBufferRef, ambientGainRef, masterGainRef, triggerTimeRef, musicStartedRef }
      if (ctx.state === 'suspended') ctx.resume().then(() => startMusic(r))
      else startMusic(r)
    }
  }, [muted])

  useEffect(() => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    fetch(`${import.meta.env.BASE_URL}Netherwing-Intro-2.mp3`)
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { audioBufferRef.current = buf })
      .catch(err => console.error('audio load error:', err))

    fetch(`${import.meta.env.BASE_URL}Antila_Floriography.mp3`)
      .then(r => r.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(buf => { ambientBufferRef.current = buf })
      .catch(err => console.error('ambient load error:', err))
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

  // Any real tap / click / keypress unlocks audio. Scroll and swipe don't count as
  // user activation, so the context can still be suspended after the intro starts;
  // this (and the sound button) resumes it and startMusic catches up in sync.
  useEffect(() => {
    const r = { audioCtxRef, audioBufferRef, ambientBufferRef, ambientGainRef, masterGainRef, triggerTimeRef, musicStartedRef }
    function unlockAudio() {
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume().then(() => startMusic(r)).catch(() => {})
      else startMusic(r)
    }
    const events = ['pointerdown', 'touchend', 'keydown']
    events.forEach((ev) => window.addEventListener(ev, unlockAudio))
    return () => events.forEach((ev) => window.removeEventListener(ev, unlockAudio))
  }, [])

  useEffect(() => {
    // The intro starts on the first "scroll down" intent: mouse wheel,
    // trackpad, swipe up on touch screens, or arrow / page / space keys.
    function startIntro() {
      if (!modelReady || triggered.current) return false
      triggered.current = true

      document.body.style.overflow = 'hidden'
      setAnimating(true)
      window.dispatchEvent(new CustomEvent('riftTrigger'))

      triggerTimeRef.current = performance.now()
      const ctx = audioCtxRef.current
      if (ctx) {
        // May stay suspended (scroll/swipe isn't a user-activation gesture) —
        // the first tap/click/key resumes it later and startMusic catches up.
        const r = { audioCtxRef, audioBufferRef, ambientBufferRef, ambientGainRef, masterGainRef, triggerTimeRef, musicStartedRef }
        if (ctx.state === 'suspended') ctx.resume().then(() => startMusic(r)).catch(() => {})
        else startMusic(r)
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
      return true
    }

    function onWheel(e) {
      if (e.deltaY <= 0) return
      if (startIntro()) e.preventDefault()
    }

    let touchStartY = null
    function onTouchStart(e) { touchStartY = e.touches[0].clientY }
    function onTouchMove(e) {
      if (triggered.current) return
      e.preventDefault() // page is locked until the intro plays; stop rubber-banding
      if (touchStartY === null) return
      const swipeUp = touchStartY - e.touches[0].clientY
      if (swipeUp > 24) startIntro()
    }

    const INTRO_KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End']
    function onKeyDown(e) {
      if (!INTRO_KEYS.includes(e.key)) return
      if (e.target.closest?.('button, a, input, textarea')) return // let focused controls handle keys
      if (startIntro()) e.preventDefault()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
    }
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

// The full experience runs on every screen size — scenes and layout resize live
export default function App() {
  return <DesktopApp />
}