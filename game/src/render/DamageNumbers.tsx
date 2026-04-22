import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/store'

// HTML-overlay damage numbers. Implemented without drei <Text> on purpose:
// <Text> pulls a font over the network and, if it ever fails to load, it
// suspends forever — and with Suspense fallback={null}, that manifests
// as a black screen on mobile.

const _proj = new THREE.Vector3()

export function DamageNumbers() {
  const { camera, size } = useThree()
  const hostRef = useRef<HTMLDivElement | null>(null)

  // Grab (or create) the DOM overlay mounted by DamageNumbersLayer.
  if (!hostRef.current) {
    hostRef.current = document.getElementById('dmg-layer') as HTMLDivElement | null
  }

  useFrame(() => {
    const host = hostRef.current ?? (document.getElementById('dmg-layer') as HTMLDivElement | null)
    if (!host) return
    hostRef.current = host
    const nums = useGame.getState().damageNumbers

    while (host.childElementCount < nums.length) {
      const d = document.createElement('div')
      d.style.position = 'absolute'
      d.style.transform = 'translate(-50%, -50%)'
      d.style.pointerEvents = 'none'
      d.style.fontWeight = '800'
      d.style.textShadow = '0 0 2px #000, 0 0 3px #000, 0 1px 2px #000'
      d.style.fontFamily = 'inherit'
      d.style.willChange = 'transform,opacity'
      host.appendChild(d)
    }
    while (host.childElementCount > nums.length) {
      host.removeChild(host.lastChild!)
    }
    for (let i = 0; i < nums.length; i++) {
      const n = nums[i]
      _proj.copy(n.pos).project(camera)
      const x = (_proj.x * 0.5 + 0.5) * size.width
      const y = (-_proj.y * 0.5 + 0.5) * size.height
      const el = host.children[i] as HTMLDivElement
      const alpha = Math.max(0, 1 - n.age / 1.1)
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      el.style.opacity = String(alpha)
      el.style.color = n.color
      el.style.fontSize = n.isCrit ? '22px' : '15px'
      el.textContent = n.amount > 0 ? String(n.amount) : '★'
      el.style.display = _proj.z > 1 || _proj.z < -1 ? 'none' : 'block'
    }
  })

  return null
}

export function DamageNumbersLayer() {
  return (
    <div
      id="dmg-layer"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 4,
        overflow: 'hidden',
      }}
    />
  )
}
