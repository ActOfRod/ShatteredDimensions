import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'
import { Joystick } from './Joystick'

export function MobileControls() {
  const setInput = useGame((s) => s.setInput)
  const setCameraYaw = useGame((s) => s.setCameraYaw)

  // Keyboard support for desktop testing
  const keysRef = useRef({ w: false, a: false, s: false, d: false, left: false, right: false })
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keysRef.current.w = true
      if (k === 's' || k === 'arrowdown') keysRef.current.s = true
      if (k === 'a') keysRef.current.a = true
      if (k === 'd') keysRef.current.d = true
      if (k === 'arrowleft') keysRef.current.left = true
      if (k === 'arrowright') keysRef.current.right = true
      if (k === ' ') setInput({ firing: true })
      if (k === 'e') setInput({ triggerSecondary: true })
      if (k === 'shift') setInput({ triggerUtility: true, dashQueued: true })
      if (k === 'q' || k === 'r') setInput({ triggerSpecial: true })
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keysRef.current.w = false
      if (k === 's' || k === 'arrowdown') keysRef.current.s = false
      if (k === 'a') keysRef.current.a = false
      if (k === 'd') keysRef.current.d = false
      if (k === 'arrowleft') keysRef.current.left = false
      if (k === 'arrowright') keysRef.current.right = false
      if (k === ' ') setInput({ firing: false })
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    let lastT = performance.now()
    const iv = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(0.1, (now - lastT) / 1000)
      lastT = now
      const { w, a, s, d, left, right } = keysRef.current
      const x = (d ? 1 : 0) - (a ? 1 : 0)
      const y = (w ? 1 : 0) - (s ? 1 : 0)
      const len = Math.hypot(x, y)
      if (len > 0) setInput({ moveX: x / len, moveY: y / len })
      else {
        const st = useGame.getState().input
        if (st.moveX !== 0 || st.moveY !== 0) setInput({ moveX: 0, moveY: 0 })
      }
      // Arrow L/R rotate camera on desktop
      const turn = (right ? 1 : 0) - (left ? 1 : 0)
      if (turn !== 0) {
        const cur = useGame.getState().cameraYaw
        setCameraYaw(cur + turn * 1.8 * dt)
      }
    }, 30)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      clearInterval(iv)
    }
  }, [setInput, setCameraYaw])

  // Right stick rotates the camera; horizontal drag amount -> angular velocity.
  const cameraTurnRate = useRef(0)
  useEffect(() => {
    let raf: number
    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const rate = cameraTurnRate.current
      if (Math.abs(rate) > 0.001) {
        setCameraYaw(useGame.getState().cameraYaw + rate * dt)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [setCameraYaw])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      <Joystick
        side="left"
        color="#7ec8ff"
        onMove={(x, y) => setInput({ moveX: x, moveY: y })}
        onEnd={() => setInput({ moveX: 0, moveY: 0 })}
      />
      <Joystick
        side="right"
        color="#c9ffa8"
        onMove={(x, _y) => {
          // Only horizontal component controls camera yaw (for now).
          // Positive x = turn right.
          cameraTurnRate.current = x * 3.2 // rad/s at full deflection
        }}
        onEnd={() => {
          cameraTurnRate.current = 0
        }}
      />

      <AbilityButtons />
    </div>
  )
}

function AbilityButtons() {
  const cdSecondary = useGame((s) => s.cdSecondary)
  const cdUtility = useGame((s) => s.cdUtility)
  const cdSpecial = useGame((s) => s.cdSpecial)
  const character = useGame((s) => s.character)
  const setInput = useGame((s) => s.setInput)

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 240,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 72px)',
        gap: 10,
        pointerEvents: 'auto',
        zIndex: 20,
      }}
    >
      <AbilityButton
        label={character.secondary.name}
        hotkey="M2"
        color="#a0e0ff"
        cd={cdSecondary}
        maxCd={character.secondary.cooldown}
        onPress={() => setInput({ triggerSecondary: true })}
      />
      <AbilityButton
        label={character.utility.name}
        hotkey="Dash"
        color="#b8ff9a"
        cd={cdUtility}
        maxCd={character.utility.cooldown}
        onPress={() => setInput({ triggerUtility: true, dashQueued: true })}
      />
      <AbilityButton
        label={character.special.name}
        hotkey="Special"
        color="#ff9a5a"
        cd={cdSpecial}
        maxCd={character.special.cooldown}
        onPress={() => setInput({ triggerSpecial: true })}
      />
      <FireToggle />
    </div>
  )
}

function AbilityButton({
  label,
  hotkey,
  color,
  cd,
  maxCd,
  onPress,
}: {
  label: string
  hotkey: string
  color: string
  cd: number
  maxCd: number
  onPress: () => void
}) {
  const ready = cd <= 0
  const pct = maxCd > 0 ? Math.min(1, cd / maxCd) : 0
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault()
        if (ready) onPress()
      }}
      onClick={() => {
        if (ready) onPress()
      }}
      style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: ready ? `${color}22` : '#151a22',
        border: `2px solid ${ready ? color : '#3a3f4a'}`,
        color: ready ? color : '#6a6f7a',
        fontSize: 11,
        fontWeight: 600,
        textAlign: 'center',
        padding: 4,
        lineHeight: 1.1,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ fontSize: 9, opacity: 0.75 }}>{hotkey}</div>
      <div style={{ fontSize: 11 }}>{label}</div>
      {!ready && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${pct * 100}%`,
              background: '#00000088',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {cd.toFixed(1)}
          </div>
        </>
      )}
    </button>
  )
}

function FireToggle() {
  const setInput = useGame((s) => s.setInput)
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault()
        setInput({ firing: true })
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        setInput({ firing: false })
      }}
      onTouchCancel={() => setInput({ firing: false })}
      onMouseDown={() => setInput({ firing: true })}
      onMouseUp={() => setInput({ firing: false })}
      onMouseLeave={() => setInput({ firing: false })}
      style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: '#ffd06722',
        border: '2px solid #ffd067',
        color: '#ffd067',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      FIRE
    </button>
  )
}
