import { useMemo } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/store'

export function WorldScene() {
  const world = useGame((s) => s.world)
  const props = useGame((s) => s.props)

  const arenaGeom = useMemo(() => new THREE.CircleGeometry(world.arenaRadius, 48), [world.arenaRadius])
  const ringGeom = useMemo(
    () => new THREE.RingGeometry(world.arenaRadius - 0.5, world.arenaRadius + 0.2, 48),
    [world.arenaRadius]
  )

  return (
    <group>
      <color attach="background" args={[world.fog]} />
      <fog attach="fog" args={[world.fog, 18, 70]} />
      <hemisphereLight args={[world.skyTop, world.ground, 0.95]} />
      <directionalLight position={[20, 30, 10]} intensity={1.2} color={world.ambient} />
      <ambientLight intensity={0.25} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={arenaGeom} attach="geometry" />
        <meshStandardMaterial color={world.ground} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <primitive object={ringGeom} attach="geometry" />
        <meshBasicMaterial color={world.accent} transparent opacity={0.4} />
      </mesh>

      {/* Props */}
      {props.map((p) => (
        <Prop key={p.id} prop={p} />
      ))}
    </group>
  )
}

function Prop({ prop }: { prop: ReturnType<typeof useGame.getState>['props'][number] }) {
  if (prop.kind === 'tree') {
    return (
      <group position={prop.pos} rotation={[0, prop.rot, 0]} scale={prop.scale}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 1.6, 6]} />
          <meshStandardMaterial color="#5a3a24" />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <coneGeometry args={[1.1, 2.3, 6]} />
          <meshStandardMaterial color={prop.color} roughness={0.9} />
        </mesh>
      </group>
    )
  }
  if (prop.kind === 'pillar') {
    return (
      <group position={prop.pos} rotation={[0, prop.rot, 0]} scale={prop.scale}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 2.8, 8]} />
          <meshStandardMaterial color={prop.color} roughness={0.7} />
        </mesh>
      </group>
    )
  }
  // rock
  return (
    <mesh position={prop.pos} rotation={[0, prop.rot, 0]} scale={prop.scale}>
      <dodecahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color={prop.color} roughness={0.95} flatShading />
    </mesh>
  )
}
