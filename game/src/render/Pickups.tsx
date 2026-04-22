import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'

export function GoldRenderer() {
  useGame((s) => s.entityVersion)
  const drops = useGame.getState().goldDrops
  return (
    <group>
      {drops.map((g) => (
        <GoldCoin key={g.id} pos={g.pos} />
      ))}
    </group>
  )
}

function GoldCoin({ pos }: { pos: THREE.Vector3 }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!mesh.current) return
    mesh.current.position.copy(pos)
    mesh.current.position.y = 0.5 + Math.sin(performance.now() / 200 + pos.x) * 0.15
    mesh.current.rotation.y += 0.08
  })
  return (
    <mesh ref={mesh} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.06, 12]} />
      <meshStandardMaterial color="#ffcf45" emissive="#ffa500" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

export function ChestsRenderer() {
  useGame((s) => s.entityVersion)
  const chests = useGame.getState().chests
  return (
    <group>
      {chests.map((c) => (
        <mesh key={c.id} position={c.pos} castShadow>
          <boxGeometry args={[1.0, 0.7, 0.7]} />
          <meshStandardMaterial
            color={c.opened ? '#444' : c.rarity === 'legendary' ? '#c93ab2' : c.rarity === 'uncommon' ? '#5a8fcf' : '#a08a6a'}
            emissive={c.opened ? '#000' : c.rarity === 'legendary' ? '#ff5fb8' : c.rarity === 'uncommon' ? '#7ec8ff' : '#4a3a24'}
            emissiveIntensity={c.opened ? 0 : 0.5}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

export function TeleporterRenderer() {
  const pos = useGame((s) => s.teleporterPos)
  const active = useGame((s) => s.teleporterActive)
  const charge = useGame((s) => s.teleporterCharge)
  const ring = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!ring.current) return
    ring.current.rotation.y += 0.02
    const mat = ring.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.5 + Math.sin(performance.now() / 300) * 0.2
  })

  if (!pos) return null
  const color = active ? '#ffd067' : '#7ec8ff'

  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.2, 1.8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.9, 2.05, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      {/* Charge indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.5, 1.1, 32, 1, 0, Math.PI * 2 * charge]} />
        <meshBasicMaterial color="#ffd067" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 3.0, 8]} />
        <meshStandardMaterial color="#2a2f3a" emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
