import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'

const targetOffset = new THREE.Vector3(0, 12, 10)

export function CameraRig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3())
  useFrame((_, dt) => {
    const p = useGame.getState().playerPos
    const desired = new THREE.Vector3(p.x + targetOffset.x, p.y + targetOffset.y, p.z + targetOffset.z)
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt))
    look.current.lerp(p, 1 - Math.pow(0.001, dt))
    camera.lookAt(look.current)
  })
  return null
}
