import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'

export function PlayerMesh() {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const { playerPos, playerFacing, hitFlash, character, dashTime } = useGame.getState()
    if (!group.current) return
    group.current.position.copy(playerPos)
    const yaw = Math.atan2(playerFacing.x, playerFacing.z)
    group.current.rotation.y = yaw
    if (body.current) {
      const mat = body.current.material as THREE.MeshStandardMaterial
      mat.emissive = new THREE.Color(hitFlash > 0 ? '#ff4040' : character.color)
      mat.emissiveIntensity = hitFlash > 0 ? hitFlash * 2 : 0.22
      const s = dashTime > 0 ? 0.8 : 1
      group.current.scale.setScalar(s)
    }
  })

  const character = useGame((s) => s.character)

  return (
    <group ref={group}>
      {/* Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} />
      </mesh>
      {/* Body */}
      <mesh ref={body} position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.9, 6, 12]} />
        <meshStandardMaterial color={character.color} roughness={0.5} emissive={character.color} emissiveIntensity={0.2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.26, 12, 10]} />
        <meshStandardMaterial color="#ecece8" roughness={0.6} />
      </mesh>
      {/* Gun */}
      <mesh position={[0.28, 1.05, 0.35]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.7]} />
        <meshStandardMaterial color="#2a2a30" />
      </mesh>
      {/* Facing arrow */}
      <mesh position={[0, 0.05, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 0.5, 3]} />
        <meshBasicMaterial color={character.color} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}
