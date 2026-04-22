import * as THREE from 'three'
import type { CharacterDef } from './types'

// Starter character: Commando. More can be added here and they'll automatically
// show up on the character select screen.
export const COMMANDO: CharacterDef = {
  id: 'commando',
  name: 'Commando',
  subtitle: 'Balanced marksman',
  color: '#7ec8ff',
  baseMaxHp: 110,
  baseDamage: 12,
  baseMoveSpeed: 6.2,
  baseAttackSpeed: 2.2,
  projectileSpeed: 36,
  projectileColor: '#ffe08a',
  primary: {
    id: 'double_tap',
    name: 'Double Tap',
    description: 'Fire two quick rounds for 100% damage each.',
    cooldown: 0, // handled by attack speed
    onUse: (ctx) => {
      const d = ctx.character.baseDamage * ctx.stats.damageMult
      const crit = Math.random() < ctx.stats.critChance
      const dmg = crit ? d * ctx.stats.critMult : d
      ctx.spawnProjectile({
        origin: ctx.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
        direction: ctx.aim.clone(),
        speed: ctx.character.projectileSpeed,
        damage: dmg,
        color: ctx.character.projectileColor,
        radius: 0.18,
        pierce: 0,
        life: 1.4,
        isCrit: crit,
      })
    },
  },
  secondary: {
    id: 'phase_round',
    name: 'Phase Round',
    description: 'Pierces all enemies for 320% damage.',
    cooldown: 3.0,
    onUse: (ctx) => {
      const d = ctx.character.baseDamage * 3.2 * ctx.stats.damageMult
      const crit = Math.random() < ctx.stats.critChance
      const dmg = crit ? d * ctx.stats.critMult : d
      ctx.spawnProjectile({
        origin: ctx.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
        direction: ctx.aim.clone(),
        speed: ctx.character.projectileSpeed * 1.6,
        damage: dmg,
        color: '#c08aff',
        radius: 0.28,
        pierce: 999,
        life: 1.6,
        isCrit: crit,
      })
    },
  },
  utility: {
    id: 'tactical_dive',
    name: 'Tactical Dive',
    description: 'Roll forward a short distance.',
    cooldown: 4.0,
    onUse: () => {
      // Dash is handled by the player controller via a flag set in the store.
    },
  },
  special: {
    id: 'suppressive_fire',
    name: 'Suppressive Fire',
    description: 'Fire a burst of 6 rounds in a spread.',
    cooldown: 8.0,
    onUse: (ctx) => {
      const d = ctx.character.baseDamage * 1.0 * ctx.stats.damageMult
      for (let i = 0; i < 6; i++) {
        const spread = (i - 2.5) * 0.08
        const dir = ctx.aim.clone()
        const angle = Math.atan2(dir.x, dir.z) + spread
        dir.set(Math.sin(angle), 0, Math.cos(angle))
        const crit = Math.random() < ctx.stats.critChance
        const dmg = crit ? d * ctx.stats.critMult : d
        ctx.spawnProjectile({
          origin: ctx.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
          direction: dir,
          speed: ctx.character.projectileSpeed,
          damage: dmg,
          color: '#ff9b5a',
          radius: 0.16,
          pierce: 0,
          life: 1.2,
          isCrit: crit,
        })
      }
    },
  },
}

// Extensibility: add more characters to this list.
export const CHARACTERS: CharacterDef[] = [COMMANDO]

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? COMMANDO
}
