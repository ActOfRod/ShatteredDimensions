import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { useGame } from './game/store'
import { GameLoop } from './game/GameLoop'
import { WorldScene } from './render/World'
import { PlayerMesh } from './render/Player'
import { EnemiesRenderer } from './render/Enemies'
import { ProjectilesRenderer } from './render/Projectiles'
import { ChestsRenderer, GoldRenderer, TeleporterRenderer } from './render/Pickups'
import { DamageNumbers, DamageNumbersLayer } from './render/DamageNumbers'
import { CameraRig } from './render/CameraRig'
import { HUD } from './ui/HUD'
import { MobileControls } from './ui/MobileControls'
import { GameOverOverlay, MainMenu, StageClearedOverlay } from './ui/Menus'
import { ErrorBoundary } from './ui/ErrorBoundary'

export default function App() {
  const phase = useGame((s) => s.phase)
  const [glError, setGlError] = useState<string | null>(null)

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      console.error('window error:', e.error ?? e.message)
    }
    const onRej = (e: PromiseRejectionEvent) => {
      console.error('unhandled rejection:', e.reason)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRej)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])

  if (glError) {
    return (
      <div style={fallbackStyle}>
        <h2 style={{ color: '#ff8080' }}>WebGL failed to initialize</h2>
        <div style={{ opacity: 0.8, maxWidth: 420, lineHeight: 1.5 }}>
          {glError}
          <br />
          <br />
          Try another browser (Chrome or Safari), disable battery / low-power mode, or reboot
          and try again. Some devices block WebGL in private/incognito mode.
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas
          // Shadows disabled: cheaper and avoids GPU stalls on phones.
          shadows={false}
          dpr={[1, 1.5]}
          camera={{ position: [0, 14, 14], fov: 55 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            // Don't refuse a context on modest GPUs.
            failIfMajorPerformanceCaveat: false,
            alpha: false,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              setGlError('The WebGL context was lost (usually GPU memory pressure).')
            })
          }}
          onError={(e) => {
            // Canvas-level errors from R3F bubble here.
            setGlError(String((e as unknown as Error)?.message ?? e))
          }}
          style={{ position: 'absolute', inset: 0, background: '#0b0f1a' }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <WorldScene />
            <PlayerMesh />
            <EnemiesRenderer />
            <ProjectilesRenderer />
            <ChestsRenderer />
            <GoldRenderer />
            <TeleporterRenderer />
            <DamageNumbers />
            <GameLoop />
          </Suspense>
        </Canvas>

        <DamageNumbersLayer />

        {phase !== 'menu' && <HUD />}
        {phase !== 'menu' && phase !== 'game_over' && <MobileControls />}

        {phase === 'menu' && <MainMenu />}
        {phase === 'stage_cleared' && <StageClearedOverlay />}
        {phase === 'game_over' && <GameOverOverlay />}
      </div>
    </ErrorBoundary>
  )
}

const fallbackStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#0b0f1a',
  color: '#e8eefc',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  padding: 24,
  textAlign: 'center',
  fontFamily: 'inherit',
}
