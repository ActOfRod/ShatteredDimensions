import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGame } from './game/store'
import { GameLoop } from './game/GameLoop'
import { WorldScene } from './render/World'
import { PlayerMesh } from './render/Player'
import { EnemiesRenderer } from './render/Enemies'
import { ProjectilesRenderer } from './render/Projectiles'
import { ChestsRenderer, GoldRenderer, TeleporterRenderer } from './render/Pickups'
import { DamageNumbers } from './render/DamageNumbers'
import { CameraRig } from './render/CameraRig'
import { HUD } from './ui/HUD'
import { MobileControls } from './ui/MobileControls'
import { GameOverOverlay, MainMenu, StageClearedOverlay } from './ui/Menus'

export default function App() {
  const phase = useGame((s) => s.phase)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 14, 14], fov: 55 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
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

      {phase !== 'menu' && <HUD />}
      {phase !== 'menu' && phase !== 'game_over' && <MobileControls />}

      {phase === 'menu' && <MainMenu />}
      {phase === 'stage_cleared' && <StageClearedOverlay />}
      {phase === 'game_over' && <GameOverOverlay />}
    </div>
  )
}
