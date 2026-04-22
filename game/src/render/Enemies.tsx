import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import type { Enemy } from '../game/types'

export function EnemiesRenderer() {
  // Subscribe to entityVersion so we re-render when the (mutated) array
  // gains or loses members. We then read the current array from the store.
  useGame((s) => s.entityVersion)
  const enemies = useGame.getState().enemies
  return (
    <group>
      {enemies.map((e) => (
        <EnemyMesh key={e.id} enemy={e} />
      ))}
    </group>
  )
}

function EnemyMesh({ enemy }: { enemy: Enemy }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (!group.current) return
    group.current.position.copy(enemy.pos)
    const look = Math.atan2(enemy.vel.x, enemy.vel.z)
    if (enemy.vel.lengthSq() > 0.01) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, look, 10, dt)
    }
    // Bob
    const bob = Math.sin(performance.now() / 120 + enemy.id) * 0.06
    group.current.position.y += bob
    if (body.current) {
      const mat = body.current.material as THREE.MeshStandardMaterial
      mat.emissive = new THREE.Color(enemy.hitFlash > 0 ? '#ffffff' : enemy.def.color)
      mat.emissiveIntensity = enemy.hitFlash > 0 ? 1.6 : 0.15
    }
  })

  const def = enemy.def
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp)
  const isBoss = enemy.isBoss === true

  return (
    <group ref={group}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[def.radius * 1.1, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} />
      </mesh>

      {def.kind === 'lemurian' && (
        <>
          <mesh ref={body} position={[0, 0.8, 0]} castShadow>
            <capsuleGeometry args={[def.radius, def.height - 0.8, 6, 12]} />
            <meshStandardMaterial color={def.color} roughness={0.7} />
          </mesh>
          <mesh position={[0, def.height + 0.05, 0.2]} castShadow>
            <coneGeometry args={[def.radius * 0.6, 0.5, 6]} />
            <meshStandardMaterial color="#ff7a3a" emissive="#ff5500" emissiveIntensity={0.6} />
          </mesh>
        </>
      )}

      {def.kind === 'beetle' && (
        <mesh ref={body} position={[0, def.height / 2, 0]} castShadow>
          <sphereGeometry args={[def.radius, 12, 10]} />
          <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.4} />
        </mesh>
      )}

      {def.kind === 'wisp' && (
        <mesh ref={body} position={[0, def.height + 0.4, 0]} castShadow>
          <icosahedronGeometry args={[def.radius, 0]} />
          <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={1.2} />
        </mesh>
      )}

      {def.kind === 'stone_titan' && (
        <>
          <mesh ref={body} position={[0, def.height / 2, 0]} castShadow>
            <boxGeometry args={[def.radius * 1.6, def.height, def.radius * 1.6]} />
            <meshStandardMaterial color={def.color} roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, def.height + 0.5, 0]} castShadow>
            <boxGeometry args={[def.radius * 1.2, def.radius, def.radius * 1.2]} />
            <meshStandardMaterial color="#8a8a90" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, def.height + 0.55, def.radius * 0.6]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#ff3030" />
          </mesh>
        </>
      )}

      {/* HP bar */}
      <group position={[0, def.height + (isBoss ? 1.2 : 0.35), 0]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[isBoss ? 3.6 : 1.2, isBoss ? 0.18 : 0.08]} />
          <meshBasicMaterial color="#111" transparent opacity={0.7} />
        </mesh>
        <mesh position={[(-0.5 + hpRatio / 2) * (isBoss ? 3.6 : 1.2), 0.001, 0]}>
          <planeGeometry args={[hpRatio * (isBoss ? 3.6 : 1.2), isBoss ? 0.14 : 0.05]} />
          <meshBasicMaterial color={isBoss ? '#ff5f5f' : '#ff9a9a'} />
        </mesh>
      </group>
    </group>
  )
}
