import { useGame } from '../game/store'
import { ITEMS } from '../game/items'

export function HUD() {
  const hp = useGame((s) => s.playerHp)
  const maxHp = useGame((s) => s.stats.maxHp)
  const level = useGame((s) => s.level)
  const xp = useGame((s) => s.xp)
  const xpNext = useGame((s) => s.xpNext)
  const gold = useGame((s) => s.gold)
  const time = useGame((s) => s.time)
  const world = useGame((s) => s.world)
  const stageIndex = useGame((s) => s.stageIndex)
  const difficulty = useGame((s) => s.difficultyMult)
  const kills = useGame((s) => s.kills)
  const inventory = useGame((s) => s.inventory)
  const teleporterActive = useGame((s) => s.teleporterActive)
  const teleporterCharge = useGame((s) => s.teleporterCharge)
  const phase = useGame((s) => s.phase)
  const hitFlash = useGame((s) => s.hitFlash)

  const mins = Math.floor(time / 60)
  const secs = Math.floor(time % 60)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        fontFamily: 'inherit',
        color: '#e8eefc',
      }}
    >
      {/* Red hit flash */}
      {hitFlash > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: `radial-gradient(transparent 50%, rgba(255,0,0,${Math.min(0.5, hitFlash)}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* HP + XP + Level */}
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge color="#5a6d9a">LVL {level}</Badge>
            <Bar value={hp} max={maxHp} color="var(--hp)" label={`${Math.ceil(hp)} / ${Math.ceil(maxHp)}`} />
          </div>
          <div style={{ marginTop: 4 }}>
            <Bar value={xp} max={xpNext} color="var(--xp)" height={6} />
          </div>
        </div>

        {/* Gold + time + stage */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <Badge color="#6e572a">
            <span style={{ color: '#ffd067' }}>⬤ {gold}</span>
          </Badge>
          <Badge color="#2c3a4a">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </Badge>
          <Badge color="#3b2a4a">
            Stage {stageIndex + 1} · {world.name}
          </Badge>
          <Badge color="#552a2a">Difficulty x{difficulty.toFixed(2)}</Badge>
        </div>
      </div>

      {/* Inventory strip */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(max(12px, env(safe-area-inset-top)) + 80px)',
          left: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          maxWidth: '70vw',
        }}
      >
        {ITEMS.filter((it) => (inventory[it.id] ?? 0) > 0).map((it) => (
          <div
            key={it.id}
            title={`${it.name} x${inventory[it.id]} — ${it.description}`}
            style={{
              background: 'var(--panel)',
              border: `1px solid ${it.color}`,
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 11,
              color: it.color,
            }}
          >
            {it.name} <b style={{ color: '#fff' }}>x{inventory[it.id]}</b>
          </div>
        ))}
      </div>

      {/* Center prompts */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        {phase === 'teleporter_charging' && (
          <div
            style={{
              background: 'var(--panel)',
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--panel-border)',
            }}
          >
            Teleporter charging: {Math.floor(teleporterCharge * 100)}% — defend!
          </div>
        )}
        {phase === 'boss' && (
          <div
            style={{
              background: 'var(--panel)',
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 8,
              border: '2px solid #ff5f5f',
              color: '#ffdcdc',
              fontWeight: 700,
            }}
          >
            ⚠ BOSS ENCOUNTER ⚠
          </div>
        )}
        {phase === 'playing' && !teleporterActive && (
          <div
            style={{
              background: 'var(--panel)',
              display: 'inline-block',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--panel-border)',
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            Find the glowing teleporter to progress. Kills: {kills}
          </div>
        )}
      </div>
    </div>
  )
}

function Bar({
  value,
  max,
  color,
  label,
  height = 12,
}: {
  value: number
  max: number
  color: string
  label?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)))
  return (
    <div
      style={{
        flex: 1,
        background: '#0009',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #ffffff22',
        position: 'relative',
        height,
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: color,
          transition: 'width 120ms linear',
        }}
      />
      {label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
            textShadow: '0 0 2px #000, 0 0 2px #000',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  )
}
