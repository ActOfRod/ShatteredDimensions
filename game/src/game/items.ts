import type { ItemDef, MutableStats } from './types'

// Items follow RoR2's stacking model. Every stack adds an effect.
// Stats are recalculated from scratch each time inventory changes.

export const ITEMS: ItemDef[] = [
  {
    id: 'soldier_syringe',
    name: "Soldier's Syringe",
    description: '+15% attack speed per stack.',
    rarity: 'common',
    color: '#ffe08a',
    apply: (s, stats) => {
      stats.attackSpeedMult *= 1 + 0.15 * s
    },
  },
  {
    id: 'crowbar',
    name: 'Crowbar',
    description: '+20% damage per stack (mul).',
    rarity: 'common',
    color: '#ff8a8a',
    apply: (s, stats) => {
      stats.damageMult *= 1 + 0.2 * s
    },
  },
  {
    id: 'paul_goat_hoof',
    name: "Paul's Goat Hoof",
    description: '+14% movement speed per stack.',
    rarity: 'common',
    color: '#caffb0',
    apply: (s, stats) => {
      stats.moveSpeedMult *= 1 + 0.14 * s
    },
  },
  {
    id: 'monster_tooth',
    name: 'Monster Tooth',
    description: 'Heal 8 HP on kill per stack.',
    rarity: 'common',
    color: '#fff1b0',
    apply: (s, stats) => {
      stats.healOnKill += 8 * s
    },
  },
  {
    id: 'cautious_slug',
    name: 'Cautious Slug',
    description: 'Regen +2 HP/s per stack.',
    rarity: 'common',
    color: '#a0ffd0',
    apply: (s, stats) => {
      stats.regenPerSec += 2 * s
    },
  },
  {
    id: 'crit_glasses',
    name: 'Lens-Maker’s Glasses',
    description: '+10% crit chance per stack.',
    rarity: 'uncommon',
    color: '#ffd067',
    apply: (s, stats) => {
      stats.critChance += 0.1 * s
    },
  },
  {
    id: 'ukulele',
    name: 'Ukulele',
    description: '+12% chance on hit to chain to a nearby enemy, per stack.',
    rarity: 'uncommon',
    color: '#7ec8ff',
    apply: (s, stats) => {
      stats.onHitChainChance = Math.min(0.9, stats.onHitChainChance + 0.12 * s)
    },
  },
  {
    id: 'vitality',
    name: 'Infusion',
    description: '+25 max HP per stack.',
    rarity: 'uncommon',
    color: '#ff6b6b',
    apply: (s, stats) => {
      stats.maxHp += 25 * s
    },
  },
  {
    id: 'brilliant_behemoth',
    name: 'Brilliant Behemoth',
    description: 'Damage +50% per stack (mul).',
    rarity: 'legendary',
    color: '#ff5fb8',
    apply: (s, stats) => {
      stats.damageMult *= 1 + 0.5 * s
    },
  },
  {
    id: 'midas',
    name: "Midas' Touch",
    description: '+25% gold gain per stack.',
    rarity: 'legendary',
    color: '#ffcc3a',
    apply: (s, stats) => {
      stats.goldMult *= 1 + 0.25 * s
    },
  },
]

export function getItem(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id)
}

export function rollItem(rarity: 'common' | 'uncommon' | 'legendary'): ItemDef {
  const pool = ITEMS.filter((i) => i.rarity === rarity)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function baseStats(maxHp: number): MutableStats {
  return {
    maxHp,
    damageMult: 1,
    attackSpeedMult: 1,
    moveSpeedMult: 1,
    critChance: 0,
    critMult: 2,
    onHitChainChance: 0,
    healOnKill: 0,
    regenPerSec: 0,
    goldMult: 1,
  }
}
