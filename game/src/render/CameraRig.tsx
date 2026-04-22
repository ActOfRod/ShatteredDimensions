import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'

// Third-person orbit cam. Distance/height tuned to give an RoR2-ish
// over-the-shoulder feel while keeping the player centered. The yaw
// comes from the store (driven by the right joystick).
const DISTANCE = 13
const HEIGHT = 8
const LOOK_AT_HEIGHT = 1.2

export function CameraRig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    const s = useGame.getState()
    const p = s.playerPos
    const yaw = s.cameraYaw

    // Camera sits behind the player along the yaw direction.
    // yaw=0 -> camera south of player (looking north).
    const offX = Math.sin(yaw) * DISTANCE
    const offZ = Math.cos(yaw) * DISTANCE
    desired.current.set(p.x + offX, p.y + HEIGHT, p.z + offZ)

    camera.position.lerp(desired.current, 1 - Math.pow(0.002, dt))
    look.current.lerp(
      _tmp.set(p.x, p.y + LOOK_AT_HEIGHT, p.z),
      1 - Math.pow(0.001, dt)
    )
    camera.lookAt(look.current)
  })

  return null
}

const _tmp = new THREE.Vector3()
