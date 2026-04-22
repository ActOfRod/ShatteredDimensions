import { CHARACTERS } from '../game/characters'
import { useGame } from '../game/store'
import { WORLDS } from '../game/worlds'

export function MainMenu() {
  const start = useGame((s) => s.startRun)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, #1b2a44 0%, #070910 70%), linear-gradient(#030408, #10162a)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 48, margin: 0, letterSpacing: 2, color: '#e8f0ff' }}>RAINFALL</h1>
      <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 12 }}>
        A mobile roguelike inspired by Risk of Rain 2
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Survivor</div>
        {CHARACTERS.map((c) => (
          <div
            key={c.id}
            style={{
              background: 'rgba(20,26,40,0.8)',
              border: `2px solid ${c.color}`,
              borderRadius: 10,
              padding: 12,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{c.subtitle}</div>
            <div style={{ marginTop: 8, fontSize: 11, display: 'grid', gap: 2 }}>
              <div><b>P</b> {c.primary.name} — {c.primary.description}</div>
              <div><b>M2</b> {c.secondary.name} — {c.secondary.description}</div>
              <div><b>Dash</b> {c.utility.name} — {c.utility.description}</div>
              <div><b>Special</b> {c.special.name} — {c.special.description}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => start('commando', WORLDS[0].id)}
        style={{
          marginTop: 10,
          padding: '14px 32px',
          fontSize: 20,
          fontWeight: 800,
          borderRadius: 12,
          background: 'linear-gradient(180deg, #3a6bff 0%, #1e3fbf 100%)',
          color: 'white',
          border: '2px solid #6fa1ff',
          boxShadow: '0 8px 30px #3a6bff55',
          cursor: 'pointer',
        }}
      >
        BEGIN RUN
      </button>

      <div style={{ fontSize: 11, opacity: 0.55, maxWidth: 380, lineHeight: 1.5 }}>
        Controls: Left stick moves. Right stick aims &amp; fires. Dash button for i-frames.
        Stand on the teleporter to summon the boss. Survive, collect items, progress worlds.
      </div>
    </div>
  )
}

export function StageClearedOverlay() {
  const next = useGame((s) => s.goToNextStage)
  const stageIndex = useGame((s) => s.stageIndex)
  const world = useGame((s) => s.world)
  const kills = useGame((s) => s.kills)
  const time = useGame((s) => s.time)

  return (
    <div style={overlayStyle}>
      <h2 style={{ margin: 0 }}>Stage {stageIndex + 1} cleared</h2>
      <div style={{ opacity: 0.7 }}>{world.name}</div>
      <div style={{ margin: '10px 0' }}>
        Kills: <b>{kills}</b> · Time: <b>{formatTime(time)}</b>
      </div>
      <button style={buttonStyle} onClick={next}>
        Advance to next stage →
      </button>
    </div>
  )
}

export function GameOverOverlay() {
  const menu = useGame((s) => s.resetToMenu)
  const start = useGame((s) => s.startRun)
  const time = useGame((s) => s.time)
  const kills = useGame((s) => s.kills)
  const stageIndex = useGame((s) => s.stageIndex)

  return (
    <div style={overlayStyle}>
      <h2 style={{ margin: 0, color: '#ff6f6f' }}>You have died.</h2>
      <div style={{ margin: '10px 0', opacity: 0.8 }}>
        Reached Stage {stageIndex + 1} · Kills {kills} · Time {formatTime(time)}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={buttonStyle} onClick={() => start('commando')}>Retry</button>
        <button style={{ ...buttonStyle, background: '#333' }} onClick={menu}>Main menu</button>
      </div>
    </div>
  )
}

function formatTime(t: number) {
  const m = Math.floor(t / 60).toString().padStart(2, '0')
  const s = Math.floor(t % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  zIndex: 100,
  textAlign: 'center',
  padding: 24,
}

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 10,
  border: '2px solid #6fa1ff',
  background: 'linear-gradient(180deg, #3a6bff 0%, #1e3fbf 100%)',
  color: 'white',
  cursor: 'pointer',
}
