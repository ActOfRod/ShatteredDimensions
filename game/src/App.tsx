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
import { GameOverOverlay, MainMenu, PauseOverlay, StageClearedOverlay } from './ui/Menus'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { WebGLErrorScreen } from './ui/WebGLErrorScreen'

type FatalKind = 'context-lost' | 'render-error' | 'no-webgl'

interface Fatal {
  kind: FatalKind
  message: string
  detail?: string
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const paused = useGame((s) => s.paused)
  const [fatal, setFatal] = useState<Fatal | null>(null)
  const [remountKey, setRemountKey] = useState(0)

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

  // Preflight: before we even try React Three Fiber, confirm the browser
  // will give us a WebGL context. If not, show a dedicated message instead
  // of the misleading "context lost" one.
  useEffect(() => {
    if (fatal) return
    try {
      const c = document.createElement('canvas')
      const gl =
        (c.getContext('webgl2') as WebGL2RenderingContext | null) ??
        (c.getContext('webgl') as WebGLRenderingContext | null) ??
        (c.getContext('experimental-webgl') as WebGLRenderingContext | null)
      if (!gl) {
        setFatal({
          kind: 'no-webgl',
          message:
            "This browser can't create a WebGL context. Try turning off any data-saver / lite mode, exiting private/incognito browsing, or updating your browser.",
        })
      }
    } catch (e) {
      setFatal({
        kind: 'no-webgl',
        message: 'WebGL probe threw an error.',
        detail: String((e as Error)?.message ?? e),
      })
    }
  }, [fatal])

  if (fatal) {
    const title =
      fatal.kind === 'no-webgl'
        ? 'WebGL is unavailable'
        : fatal.kind === 'context-lost'
          ? 'WebGL context was lost'
          : 'Game crashed'
    return (
      <WebGLErrorScreen
        title={title}
        message={fatal.message}
        detail={fatal.detail}
        onRetry={() => {
          setFatal(null)
          setRemountKey((k) => k + 1)
        }}
      />
    )
  }

  return (
    <ErrorBoundary
      onError={(err) =>
        setFatal({
          kind: 'render-error',
          message:
            'A rendering error occurred. The full error is below — please share a screenshot if this persists.',
          detail: `${err.name}: ${err.message}\n\n${err.stack ?? ''}`,
        })
      }
    >
      <div key={remountKey} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas
          shadows={false}
          dpr={[0.75, 1]}
          camera={{ position: [0, 14, 14], fov: 55 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
            alpha: false,
            stencil: false,
            preserveDrawingBuffer: false,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              setFatal({
                kind: 'context-lost',
                message:
                  'The GPU context was lost (usually memory pressure or backgrounded tab). Tap Try Again to restart the scene.',
              })
            })
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
        {phase !== 'menu' && phase !== 'game_over' && paused && <PauseOverlay />}
      </div>
    </ErrorBoundary>
  )
}
