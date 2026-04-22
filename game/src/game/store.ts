import * as THREE from 'three'
import { create } from 'zustand'
import type {
  CharacterDef,
  Chest,
  DamageNumber,
  Enemy,
  EnemyKind,
  GamePhase,
  GoldPickup,
  MutableStats,
  Projectile,
  Prop,
  WorldDef,
} from './types'
import { ENEMIES } from './enemies'
import { ITEMS, baseStats, getItem } from './items'
import { COMMANDO } from './characters'
import { DISTANT_ROOST, getWorld } from './worlds'

let nextId = 1
export const nid = () => nextId++

export interface InputState {
  // Persistent movement direction (unit vector) from virtual joystick.
  moveX: number
  moveY: number
  // Aim direction (unit vector)
  aimX: number
  aimY: number
  // Whether the player is holding fire (primary)
  firing: boolean
  // One-shot ability triggers consumed by the game loop
  triggerSecondary: boolean
  triggerUtility: boolean
  triggerSpecial: boolean
  // Utility dash command flag
  dashQueued: boolean
}

export interface GameState {
  phase: GamePhase
  time: number
  stageTime: number
  difficultyMult: number
  stageIndex: number

  character: CharacterDef
  world: WorldDef

  playerPos: THREE.Vector3
  playerVel: THREE.Vector3
  playerFacing: THREE.Vector3
  playerHp: number
  stats: MutableStats
  level: number
  xp: number
  xpNext: number
  gold: number
  inventory: Record<string, number>

  // Cooldowns in seconds remaining
  cdSecondary: number
  cdUtility: number
  cdSpecial: number
  // Primary fire cadence timer
  primaryCd: number
  // Dash i-frames
  dashTime: number
  hitFlash: number

  enemies: Enemy[]
  projectiles: Projectile[]
  goldDrops: GoldPickup[]
  chests: Chest[]
  props: Prop[]
  damageNumbers: DamageNumber[]

  teleporterPos: THREE.Vector3 | null
  teleporterCharge: number // 0..1
  teleporterActive: boolean
  bossSpawned: boolean
  bossDefeated: boolean

  input: InputState
  kills: number

  // View
  cameraYaw: number // radians; rotation around world Y

  // Bumped whenever the `enemies`, `goldDrops`, `chests` or `projectiles`
  // arrays change membership. Renderers subscribe to this so they re-render
  // even though we mutate the arrays in place (for perf).
  entityVersion: number

  // actions
  startRun: (characterId?: string, worldId?: string) => void
  resetToMenu: () => void
  recomputeStats: () => void
  addItem: (itemId: string) => void
  goToNextStage: () => void
  setInput: (patch: Partial<InputState>) => void
  setCameraYaw: (yaw: number) => void
}

const initialInput = (): InputState => ({
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 1,
  firing: false,
  triggerSecondary: false,
  triggerUtility: false,
  triggerSpecial: false,
  dashQueued: false,
})

function xpForLevel(level: number) {
  return Math.floor(45 + Math.pow(level, 1.55) * 30)
}

function buildProps(world: WorldDef): Prop[] {
  const props: Prop[] = []
  const R = world.arenaRadius
  for (let i = 0; i < world.propCount; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 4 + Math.random() * (R - 6)
    const pos = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
    const kind = Math.random() < 0.5 ? 'rock' : Math.random() < 0.7 ? 'tree' : 'pillar'
    props.push({
      id: nid(),
      pos,
      rot: Math.random() * Math.PI * 2,
      scale: 0.6 + Math.random() * 1.2,
      kind,
      color: kind === 'tree' ? world.accent : kind === 'pillar' ? '#b9b9c2' : '#8a8a96',
    })
  }
  return props
}

function buildChests(world: WorldDef, count: number): Chest[] {
  const chests: Chest[] = []
  const R = world.arenaRadius
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 8 + Math.random() * (R - 12)
    const pos = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
    const roll = Math.random()
    const rarity: 'common' | 'uncommon' | 'legendary' =
      roll < 0.8 ? 'common' : roll < 0.97 ? 'uncommon' : 'legendary'
    const baseCost = rarity === 'common' ? 25 : rarity === 'uncommon' ? 50 : 120
    chests.push({
      id: nid(),
      pos,
      cost: Math.floor(baseCost),
      opened: false,
      rarity,
    })
  }
  return chests
}

function placeTeleporter(world: WorldDef): THREE.Vector3 {
  const R = world.arenaRadius
  const a = Math.random() * Math.PI * 2
  const r = R * 0.55
  return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
}

export const useGame = create<GameState>((set, get) => {
  function recomputeStats() {
    const st = get()
    const fresh = baseStats(st.character.baseMaxHp)
    for (const item of ITEMS) {
      const stacks = st.inventory[item.id] ?? 0
      if (stacks > 0) item.apply(stacks, fresh)
    }
    // Preserve HP ratio when maxHp changes
    const ratio = st.stats.maxHp > 0 ? st.playerHp / st.stats.maxHp : 1
    set({ stats: fresh, playerHp: Math.min(fresh.maxHp, Math.max(1, ratio * fresh.maxHp)) })
  }

  return {
    phase: 'menu',
    time: 0,
    stageTime: 0,
    difficultyMult: 1,
    stageIndex: 0,

    character: COMMANDO,
    world: DISTANT_ROOST,

    playerPos: new THREE.Vector3(0, 0, 0),
    playerVel: new THREE.Vector3(0, 0, 0),
    playerFacing: new THREE.Vector3(0, 0, 1),
    playerHp: COMMANDO.baseMaxHp,
    stats: baseStats(COMMANDO.baseMaxHp),
    level: 1,
    xp: 0,
    xpNext: xpForLevel(1),
    gold: 0,
    inventory: {},

    cdSecondary: 0,
    cdUtility: 0,
    cdSpecial: 0,
    primaryCd: 0,
    dashTime: 0,
    hitFlash: 0,

    enemies: [],
    projectiles: [],
    goldDrops: [],
    chests: [],
    props: [],
    damageNumbers: [],

    teleporterPos: null,
    teleporterCharge: 0,
    teleporterActive: false,
    bossSpawned: false,
    bossDefeated: false,

    input: initialInput(),
    kills: 0,

    cameraYaw: 0,
    entityVersion: 0,

    startRun: (characterId, worldId) => {
      const character = characterId === 'commando' || !characterId ? COMMANDO : COMMANDO
      const world = worldId ? getWorld(worldId) : DISTANT_ROOST
      set({
        phase: 'playing',
        time: 0,
        stageTime: 0,
        difficultyMult: 1,
        stageIndex: 0,
        character,
        world,
        playerPos: new THREE.Vector3(0, 0, 0),
        playerVel: new THREE.Vector3(),
        playerFacing: new THREE.Vector3(0, 0, 1),
        playerHp: character.baseMaxHp,
        stats: baseStats(character.baseMaxHp),
        level: 1,
        xp: 0,
        xpNext: xpForLevel(1),
        gold: 0,
        inventory: {},
        cdSecondary: 0,
        cdUtility: 0,
        cdSpecial: 0,
        primaryCd: 0,
        dashTime: 0,
        hitFlash: 0,
        enemies: [],
        projectiles: [],
        goldDrops: [],
        chests: buildChests(world, 6),
        props: buildProps(world),
        damageNumbers: [],
        teleporterPos: placeTeleporter(world),
        teleporterCharge: 0,
        teleporterActive: false,
        bossSpawned: false,
        bossDefeated: false,
        input: initialInput(),
        kills: 0,
        cameraYaw: 0,
        entityVersion: 0,
      })
    },

    resetToMenu: () => {
      set({ phase: 'menu' })
    },

    recomputeStats,

    addItem: (itemId: string) => {
      const st = get()
      if (!getItem(itemId)) return
      const inv = { ...st.inventory, [itemId]: (st.inventory[itemId] ?? 0) + 1 }
      set({ inventory: inv })
      recomputeStats()
    },

    goToNextStage: () => {
      const st = get()
      const nextId = st.world.nextWorld ?? 'distant_roost'
      const next = getWorld(nextId)
      set({
        phase: 'playing',
        world: next,
        stageTime: 0,
        stageIndex: st.stageIndex + 1,
        difficultyMult: st.difficultyMult + 0.25,
        playerPos: new THREE.Vector3(0, 0, 0),
        enemies: [],
        projectiles: [],
        goldDrops: [],
        chests: buildChests(next, 6 + Math.floor(st.stageIndex / 2)),
        props: buildProps(next),
        teleporterPos: placeTeleporter(next),
        teleporterCharge: 0,
        teleporterActive: false,
        bossSpawned: false,
        bossDefeated: false,
        entityVersion: st.entityVersion + 1,
      })
    },

    setInput: (patch) => {
      // Functional update so concurrent callers (two joysticks + buttons)
      // don't clobber each other.
      set((s) => ({ input: { ...s.input, ...patch } }))
    },

    setCameraYaw: (yaw) => set({ cameraYaw: yaw }),
  }
})

// ---------- Helpers accessible to systems ----------

export function pushDamageNumber(
  list: DamageNumber[],
  pos: THREE.Vector3,
  amount: number,
  isCrit: boolean,
  color = '#fff'
) {
  list.push({
    id: nid(),
    pos: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.6, (Math.random() - 0.5) * 0.6)),
    amount: Math.round(amount),
    age: 0,
    isCrit,
    color,
  })
  if (list.length > 48) list.splice(0, list.length - 48)
}

export function enemyPool(stageIndex: number): EnemyKind[] {
  // Which enemies are available on each stage
  if (stageIndex === 0) return ['lemurian', 'beetle']
  if (stageIndex === 1) return ['lemurian', 'beetle', 'wisp']
  return ['lemurian', 'beetle', 'wisp']
}

export function makeEnemy(kind: EnemyKind, pos: THREE.Vector3, difficultyMult: number, isBoss = false): Enemy {
  const def = ENEMIES[kind]
  const hp = Math.floor(def.hp * difficultyMult)
  return {
    id: nid(),
    kind,
    def,
    pos: pos.clone(),
    vel: new THREE.Vector3(),
    hp,
    maxHp: hp,
    attackCd: def.attackCooldown * (0.5 + Math.random() * 0.5),
    hitFlash: 0,
    isBoss,
  }
}

export { xpForLevel }
