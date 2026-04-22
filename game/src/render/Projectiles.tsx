import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'

const MAX_PROJ = 400

export function ProjectilesRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())
  const color = useRef(new THREE.Color())

  useFrame(() => {
    const { projectiles } = useGame.getState()
    const mesh = meshRef.current
    if (!mesh) return
    const d = dummy.current
    const c = color.current
    const count = Math.min(projectiles.length, MAX_PROJ)
    for (let i = 0; i < count; i++) {
      const p = projectiles[i]
      d.position.copy(p.pos)
      const scale = p.radius * 2.2 * (1 + (p.isCrit ? 0.4 : 0))
      d.scale.setScalar(scale)
      // Orient along velocity
      const len = Math.hypot(p.vel.x, p.vel.z)
      d.rotation.y = Math.atan2(p.vel.x, p.vel.z)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
      c.set(p.color)
      mesh.setColorAt(i, c)
      void len
    }
    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PROJ]}>
      <sphereGeometry args={[0.5, 10, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
