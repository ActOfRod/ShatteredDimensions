import * as THREE from 'three'

export type Vec3 = [number, number, number]

export type CharacterId = 'commando' | 'huntress' | 'engineer'

export interface AbilityDef {
  id: string
  name: string
  description: string
  cooldown: number
  onUse: (ctx: AbilityContext) => void
}

export interface CharacterDef {
  id: CharacterId
  name: string
  subtitle: string
  color: string
  baseMaxHp: number
  baseDamage: number
  baseMoveSpeed: number
  baseAttackSpeed: number // shots per second
  projectileSpeed: number
  projectileColor: string
  primary: AbilityDef
  secondary: AbilityDef
  utility: AbilityDef
  special: AbilityDef
}

export interface WorldDef {
  id: string
  name: string
  subtitle: string
  ambient: string // hex
  fog: string
  ground: string
  accent: string
  skyTop: string
  skyBottom: string
  arenaRadius: number
  propCount: number
  nextWorld?: string
}

export interface ItemDef {
  id: string
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'legendary'
  color: string
  // Applied whenever stacks change or game inits
  apply: (stacks: number, stats: MutableStats) => void
}

export interface MutableStats {
  maxHp: number
  damageMult: number
  attackSpeedMult: number
  moveSpeedMult: number
  critChance: number // 0-1
  critMult: number
  onHitChainChance: number // chain-lightning-like
  healOnKill: number
  regenPerSec: number
  goldMult: number
}

export interface AbilityContext {
  position: THREE.Vector3
  aim: THREE.Vector3 // unit vector
  stats: MutableStats
  character: CharacterDef
  spawnProjectile: (p: SpawnProjectile) => void
  now: number
}

export interface SpawnProjectile {
  origin: THREE.Vector3
  direction: THREE.Vector3
  speed: number
  damage: number
  color: string
  radius?: number
  pierce?: number
  life?: number
  isCrit?: boolean
}

export interface Projectile {
  id: number
  pos: THREE.Vector3
  vel: THREE.Vector3
  damage: number
  color: string
  radius: number
  pierce: number
  life: number
  age: number
  hit: Set<number>
  isCrit: boolean
}

export type EnemyKind = 'lemurian' | 'beetle' | 'wisp' | 'stone_titan'

export interface EnemyDef {
  kind: EnemyKind
  name: string
  color: string
  hp: number
  damage: number
  speed: number
  radius: number
  height: number
  attackRange: number
  attackCooldown: number
  xpValue: number
  goldValue: number
  credits: number // director credits cost
  isBoss?: boolean
}

export interface Enemy {
  id: number
  kind: EnemyKind
  def: EnemyDef
  pos: THREE.Vector3
  vel: THREE.Vector3
  hp: number
  maxHp: number
  attackCd: number
  hitFlash: number
  isBoss?: boolean
}

export interface GoldPickup {
  id: number
  pos: THREE.Vector3
  amount: number
  age: number
}

export interface Chest {
  id: number
  pos: THREE.Vector3
  cost: number
  opened: boolean
  rarity: 'common' | 'uncommon' | 'legendary'
}

export interface Prop {
  id: number
  pos: THREE.Vector3
  rot: number
  scale: number
  kind: 'rock' | 'tree' | 'pillar'
  color: string
}

export type GamePhase =
  | 'menu'
  | 'playing'
  | 'teleporter_charging'
  | 'boss'
  | 'stage_cleared'
  | 'game_over'

export interface DamageNumber {
  id: number
  pos: THREE.Vector3
  amount: number
  age: number
  isCrit: boolean
  color: string
}
