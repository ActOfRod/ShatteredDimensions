import { useEffect, useRef } from 'react'

interface Props {
  side: 'left' | 'right'
  color?: string
  onMove: (x: number, y: number) => void // x,y in [-1,1]; +y = up on screen
  onEnd: () => void
  onStart?: () => void
}

// Custom pointer-event joystick. Replaces nipplejs, which had an awkward
// API and a 'this' binding landmine. This one has zero dependencies and
// uses the pointer events spec (covers touch, mouse, and stylus).
export function Joystick({ side, color = '#7ec8ff', onMove, onEnd, onStart }: Props) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<number | null>(null)
  const centerRef = useRef<{ x: number; y: number } | null>(null)

  // Keep the latest callbacks in refs so the event listeners stay correct
  // even if props change across renders.
  const cbRef = useRef({ onMove, onEnd, onStart })
  cbRef.current = { onMove, onEnd, onStart }

  useEffect(() => {
    const zone = zoneRef.current
    const knob = knobRef.current
    if (!zone || !knob) return

    const BASE_RADIUS = 60 // CSS px
    const MAX_KNOB = 50 // knob stays within this radius

    const setKnob = (dx: number, dy: number) => {
      // dx,dy are already clamped to [-MAX_KNOB, MAX_KNOB]
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    }

    const resetKnob = () => {
      knob.style.transform = 'translate(-50%, -50%)'
    }
    resetKnob()

    const onPointerDown = (e: PointerEvent) => {
      if (activeIdRef.current !== null) return
      activeIdRef.current = e.pointerId
      try {
        zone.setPointerCapture(e.pointerId)
      } catch {
        // setPointerCapture can fail if the pointer isn't tracked yet
      }
      centerRef.current = { x: e.clientX, y: e.clientY }
      setKnob(0, 0)
      cbRef.current.onStart?.()
      e.preventDefault()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (activeIdRef.current !== e.pointerId) return
      const c = centerRef.current
      if (!c) return
      let dx = e.clientX - c.x
      let dy = e.clientY - c.y
      const len = Math.hypot(dx, dy)
      const max = BASE_RADIUS
      if (len > max) {
        dx = (dx / len) * max
        dy = (dy / len) * max
      }
      const knobDx = (dx / max) * MAX_KNOB
      const knobDy = (dy / max) * MAX_KNOB
      setKnob(knobDx, knobDy)
      // Normalize to [-1, 1], invert Y so up-on-screen = +y
      const nx = dx / max
      const ny = -dy / max
      cbRef.current.onMove(nx, ny)
      e.preventDefault()
    }

    const end = (e: PointerEvent) => {
      if (activeIdRef.current !== e.pointerId) return
      activeIdRef.current = null
      centerRef.current = null
      resetKnob()
      cbRef.current.onMove(0, 0)
      cbRef.current.onEnd()
      try {
        zone.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    zone.addEventListener('pointerdown', onPointerDown)
    zone.addEventListener('pointermove', onPointerMove)
    zone.addEventListener('pointerup', end)
    zone.addEventListener('pointercancel', end)
    zone.addEventListener('pointerleave', end)

    return () => {
      zone.removeEventListener('pointerdown', onPointerDown)
      zone.removeEventListener('pointermove', onPointerMove)
      zone.removeEventListener('pointerup', end)
      zone.removeEventListener('pointercancel', end)
      zone.removeEventListener('pointerleave', end)
    }
  }, [])

  return (
    <div
      ref={zoneRef}
      style={{
        position: 'fixed',
        bottom: 20,
        [side]: 20,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: `${color}18`,
        border: `2px solid ${color}66`,
        zIndex: 15,
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
    >
      <div
        ref={knobRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `${color}aa`,
          border: `2px solid ${color}`,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 2px 10px ${color}66`,
        }}
      />
    </div>
  )
}
