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
    type AnyHandler = (e: unknown, data: unknown) => void
    const on = manager.on as (name: string, cb: AnyHandler) => void
    on('start', () => onStart?.())
    on('move', (_e, data) => {
      const v = (data as { vector?: { x: number; y: number } })?.vector
      if (!v) return
      onMove(v.x, v.y)
    })
    on('end', () => {
      onMove(0, 0)
      onEnd()
    })
    return () => {
      manager.destroy()
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
