import './App.css'
// import DragonScene from './components/DragonScene'
// import VignetteOverlay from './components/VignetteOverlay'
// import RiftCanvas from './components/RiftCanvas'
// import ClawScene from './components/ClawScene'
import Portfolio from './web_components/Portfolio'

function App() {
  return (
    <main style={{ background: '#000' }}>
      {/* <DragonScene /> */}       {/* z:1  — full dragon behind fabric */}
      {/* <VignetteOverlay /> */}   {/* z:5  — vignette between dragon and rift */}
      {/* z:10 — fabric tears open */}
      {/* <RiftCanvas /> */}
      {/* z:20 — claws punch through fabric */}
      {/* <ClawScene /> */}
      <Portfolio />
    </main>
  )
}

export default App