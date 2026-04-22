import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'
import { Joystick } from './Joystick'

export function MobileControls() {
  // Update input in the store on every change without re-renders
  const setInput = (patch: Partial<ReturnType<typeof useGame.getState>['input']>) => {
    const s = useGame.getState()
    useGame.setState({ input: { ...s.input, ...patch } })
  }

  // Keyboard support for desktop testing
  const keysRef = useRef({ w: false, a: false, s: false, d: false })
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keysRef.current.w = true
      if (k === 's' || k === 'arrowdown') keysRef.current.s = true
      if (k === 'a' || k === 'arrowleft') keysRef.current.a = true
      if (k === 'd' || k === 'arrowright') keysRef.current.d = true
      if (k === ' ') setInput({ firing: true })
      if (k === 'e') setInput({ triggerSecondary: true })
      if (k === 'shift') setInput({ triggerUtility: true, dashQueued: true })
      if (k === 'q' || k === 'r') setInput({ triggerSpecial: true })
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keysRef.current.w = false
      if (k === 's' || k === 'arrowdown') keysRef.current.s = false
      if (k === 'a' || k === 'arrowleft') keysRef.current.a = false
      if (k === 'd' || k === 'arrowright') keysRef.current.d = false
      if (k === ' ') setInput({ firing: false })
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const iv = setInterval(() => {
      const { w, a, s, d } = keysRef.current
      const x = (d ? 1 : 0) - (a ? 1 : 0)
      const y = (w ? 1 : 0) - (s ? 1 : 0)
      if (x || y) {
        const len = Math.hypot(x, y) || 1
        setInput({ moveX: x / len, moveY: y / len })
      } else if (useGame.getState().input.moveX !== 0 || useGame.getState().input.moveY !== 0) {
        // Only clear if keyboard was last input; this is a soft reset
      }
    }, 30)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      clearInterval(iv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        color="#ffd067"
        onMove={(x, y) => setInput({ aimX: x, aimY: y, firing: true })}
        onEnd={() => setInput({ firing: false })}
      />

      {/* Ability buttons */}
      <AbilityButtons />
    </div>
  )
}

function AbilityButtons() {
  const cdSecondary = useGame((s) => s.cdSecondary)
  const cdUtility = useGame((s) => s.cdUtility)
  const cdSpecial = useGame((s) => s.cdSpecial)
  const character = useGame((s) => s.character)

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
        onPress={() => useGame.setState({ input: { ...useGame.getState().input, triggerSecondary: true } })}
      />
      <AbilityButton
        label={character.utility.name}
        hotkey="Dash"
        color="#b8ff9a"
        cd={cdUtility}
        maxCd={character.utility.cooldown}
        onPress={() =>
          useGame.setState({
            input: { ...useGame.getState().input, triggerUtility: true, dashQueued: true },
          })
        }
      />
      <AbilityButton
        label={character.special.name}
        hotkey="Special"
        color="#ff9a5a"
        cd={cdSpecial}
        maxCd={character.special.cooldown}
        onPress={() => useGame.setState({ input: { ...useGame.getState().input, triggerSpecial: true } })}
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
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault()
        useGame.setState({ input: { ...useGame.getState().input, firing: true } })
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        useGame.setState({ input: { ...useGame.getState().input, firing: false } })
      }}
      onMouseDown={() => useGame.setState({ input: { ...useGame.getState().input, firing: true } })}
      onMouseUp={() => useGame.setState({ input: { ...useGame.getState().input, firing: false } })}
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
