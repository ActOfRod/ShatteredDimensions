import { useEffect, useRef } from 'react'
import nipplejs from 'nipplejs'

interface Props {
  side: 'left' | 'right'
  color?: string
  onMove: (x: number, y: number) => void // x,y in [-1,1]
  onEnd: () => void
  onStart?: () => void
}

export function Joystick({ side, color = '#7ec8ff', onMove, onEnd, onStart }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const managerRef = useRef<ReturnType<typeof nipplejs.create> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const manager = nipplejs.create({
      zone: ref.current,
      mode: 'static',
      position: side === 'left' ? { left: '70px', bottom: '100px' } : { right: '70px', bottom: '100px' },
      color,
      size: 120,
      restOpacity: 0.55,
      fadeTime: 120,
    })
    managerRef.current = manager
    // IMPORTANT: call `manager.on` as a method — aliasing it to a local
    // variable loses the `this` binding and the library internally calls
    // `this.mapOnEvents(...)`, crashing with "Cannot read properties of
    // undefined (reading 'mapOnEvents')".
    const handleStart = () => {
      onStart?.()
    }
    const handleMove = (_e: unknown, data: unknown) => {
      const v = (data as { vector?: { x: number; y: number } })?.vector
      if (!v) return
      onMove(v.x, v.y)
    }
    const handleEnd = () => {
      onMove(0, 0)
      onEnd()
    }
    ;(manager as unknown as { on: (name: string, cb: (...args: unknown[]) => void) => void })
      .on('start', handleStart)
    ;(manager as unknown as { on: (name: string, cb: (...args: unknown[]) => void) => void })
      .on('move', handleMove)
    ;(manager as unknown as { on: (name: string, cb: (...args: unknown[]) => void) => void })
      .on('end', handleEnd)

    return () => {
      try {
        manager.destroy()
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, color])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 0,
        [side]: 0,
        width: '45vw',
        maxWidth: 260,
        height: 260,
        zIndex: 10,
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
    />
  )
}
