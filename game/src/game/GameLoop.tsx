import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { enemyPool, makeEnemy, nid, pushDamageNumber, useGame, xpForLevel } from './store'
import { ENEMIES } from './enemies'
import { rollItem } from './items'
import type { Enemy, Projectile } from './types'

// Frame-coherent vectors to avoid allocation churn
const _tmpA = new THREE.Vector3()
const _tmpB = new THREE.Vector3()
const _aim = new THREE.Vector3()
const _fwd = new THREE.Vector3()

/**
 * Headless component that advances the simulation every frame.
 * Returns null; rendering happens in the dedicated renderer components.
 */
export function GameLoop() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30) // clamp to avoid huge steps
    const s = useGame.getState()
    if (s.phase !== 'playing' && s.phase !== 'teleporter_charging' && s.phase !== 'boss') return
    let phase: import('./types').GamePhase = s.phase

    // ---------- Time & difficulty ----------
    const time = s.time + dt
    const stageTime = s.stageTime + dt
    // RoR2-ish difficulty rises with time and stage index
    const difficultyMult = 1 + (s.stageIndex * 0.25) + (time * 0.012)

    // Track initial collection sizes for entityVersion bookkeeping
    const initEnemyCount = s.enemies.length
    const initGoldCount = s.goldDrops.length
    const initProjCount = s.projectiles.length
    let chestsOpenedThisFrame = false

    // ---------- Player movement (camera-relative) ----------
    const input = s.input
    const moveSpeed = s.character.baseMoveSpeed * s.stats.moveSpeedMult * (s.dashTime > 0 ? 2.4 : 1)
    // Left stick x/y -> world direction, rotated by the camera yaw so
    // pushing up always moves "forward into the screen" regardless of
    // which way the camera is facing.
    const yaw = s.cameraYaw
    const sinY = Math.sin(yaw)
    const cosY = Math.cos(yaw)
    // In screen space: x = right, y = up. World: +x = east, +z = south.
    // Camera looks toward -forward; "up on stick" = forward = -z rotated by yaw.
    const sx = input.moveX
    const sy = input.moveY
    // screen-right = (cos,  0,  sin);  screen-forward = (-sin, 0, -cos)
    const worldX = sx * cosY - sy * sinY
    const worldZ = sx * sinY - sy * cosY
    const desiredVel = _tmpA.set(worldX, 0, worldZ).multiplyScalar(moveSpeed)
    s.playerVel.lerp(desiredVel, 1 - Math.pow(0.001, dt))
    const newPos = s.playerPos.clone().addScaledVector(s.playerVel, dt)
    const R = s.world.arenaRadius - 1
    const dist = Math.hypot(newPos.x, newPos.z)
    if (dist > R) {
      newPos.x = (newPos.x / dist) * R
      newPos.z = (newPos.z / dist) * R
    }
    s.playerPos.copy(newPos)

    // Facing: auto-aim at nearest enemy; otherwise follow movement direction.
    let aimDir: THREE.Vector3 | null = null
    let nearestDist = Infinity
    for (const e of s.enemies) {
      const d = _tmpB.copy(e.pos).sub(s.playerPos).setY(0).lengthSq()
      if (d < nearestDist) {
        nearestDist = d
        aimDir = _tmpB.clone()
      }
    }
    if (aimDir && nearestDist < 40 * 40) {
      s.playerFacing.copy(aimDir).normalize()
    } else if (s.playerVel.lengthSq() > 0.1) {
      s.playerFacing.copy(s.playerVel).setY(0).normalize()
    }

    // Dash / utility
    let dashTime = Math.max(0, s.dashTime - dt)
    let cdUtility = Math.max(0, s.cdUtility - dt)
    if (input.dashQueued && cdUtility <= 0) {
      dashTime = 0.3
      cdUtility = s.character.utility.cooldown
    }

    // ---------- Abilities ----------
    const projectiles: Projectile[] = s.projectiles
    const spawnProjectile = (p: {
      origin: THREE.Vector3
      direction: THREE.Vector3
      speed: number
      damage: number
      color: string
      radius?: number
      pierce?: number
      life?: number
      isCrit?: boolean
    }) => {
      projectiles.push({
        id: nid(),
        pos: p.origin.clone(),
        vel: p.direction.clone().setY(0).normalize().multiplyScalar(p.speed),
        damage: p.damage,
        color: p.color,
        radius: p.radius ?? 0.2,
        pierce: p.pierce ?? 0,
        life: p.life ?? 1.5,
        age: 0,
        hit: new Set(),
        isCrit: p.isCrit ?? false,
      })
    }

    const ctx = {
      position: s.playerPos,
      aim: _aim.copy(s.playerFacing),
      stats: s.stats,
      character: s.character,
      spawnProjectile,
      now: time,
    }

    // Primary fire: fires only while the FIRE button / Space is held.
    let primaryCd = Math.max(0, s.primaryCd - dt)
    const fireInterval = 1 / (s.character.baseAttackSpeed * s.stats.attackSpeedMult)
    if (input.firing && primaryCd <= 0) {
      s.character.primary.onUse(ctx)
      primaryCd = fireInterval
    }

    let cdSecondary = Math.max(0, s.cdSecondary - dt)
    if (input.triggerSecondary && cdSecondary <= 0) {
      s.character.secondary.onUse(ctx)
      cdSecondary = s.character.secondary.cooldown
    }

    let cdSpecial = Math.max(0, s.cdSpecial - dt)
    if (input.triggerSpecial && cdSpecial <= 0) {
      s.character.special.onUse(ctx)
      cdSpecial = s.character.special.cooldown
    }

    // Consume one-shot triggers without blowing away concurrent input
    // updates (joysticks, FIRE button) that happened during this frame.
    useGame.setState((prev) => {
      const i = prev.input
      if (
        !i.triggerSecondary &&
        !i.triggerUtility &&
        !i.triggerSpecial &&
        !i.dashQueued
      ) {
        return prev
      }
      return {
        input: {
          ...i,
          triggerSecondary: false,
          triggerUtility: false,
          triggerSpecial: false,
          dashQueued: false,
        },
      }
    })

    // ---------- Projectiles ----------
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      p.age += dt
      p.pos.addScaledVector(p.vel, dt)
      if (p.age > p.life) {
        projectiles.splice(i, 1)
        continue
      }
      // Arena bounds
      if (Math.hypot(p.pos.x, p.pos.z) > s.world.arenaRadius + 2) {
        projectiles.splice(i, 1)
        continue
      }
      // Enemy collisions
      for (const e of s.enemies) {
        if (p.hit.has(e.id)) continue
        const d = _tmpB.copy(p.pos).sub(e.pos).setY(0).length()
        if (d <= p.radius + e.def.radius) {
          applyDamage(e, p.damage, p.isCrit)
          p.hit.add(e.id)
          // On-hit chain lightning (ukulele)
          if (Math.random() < s.stats.onHitChainChance) {
            chainLightning(e.id, e.pos, p.damage * 0.8, s.enemies)
          }
          if (p.pierce <= 0) {
            projectiles.splice(i, 1)
            break
          } else {
            p.pierce -= 1
          }
        }
      }
    }

    // ---------- Director: spawn enemies ----------
    const enemies = s.enemies
    let bossSpawned = s.bossSpawned
    let teleporterCharge = s.teleporterCharge
    let teleporterActive = s.teleporterActive
    let bossDefeated = s.bossDefeated

    // Spawner credits (pseudo-RoR2 Director)
    const targetCount = Math.min(40, 8 + Math.floor(stageTime / 10) + Math.floor(difficultyMult * 2))
    const spawnRate = 0.4 + difficultyMult * 0.15 + stageTime * 0.002
    if (phase !== 'boss' && enemies.length < targetCount) {
      if (Math.random() < spawnRate * dt) {
        const pool = enemyPool(s.stageIndex)
        const kind = pool[Math.floor(Math.random() * pool.length)]
        const pos = randomSpawnPos(s.playerPos, s.world.arenaRadius)
        enemies.push(makeEnemy(kind, pos, difficultyMult))
      }
    }

    // Teleporter charge
    if (s.teleporterPos) {
      const playerNear = s.playerPos.distanceTo(s.teleporterPos) < 6
      if (teleporterActive && !bossSpawned && playerNear) {
        teleporterCharge = Math.min(1, teleporterCharge + dt / 30) // 30s to charge
      }
    }

    // Boss spawn when teleporter fully charged
    if (teleporterActive && teleporterCharge >= 1 && !bossSpawned) {
      const pos = randomSpawnPos(s.playerPos, s.world.arenaRadius)
      enemies.push(makeEnemy('stone_titan', pos, difficultyMult * (1 + s.stageIndex * 0.3), true))
      bossSpawned = true
      phase = 'boss'
    }

    // ---------- Enemy AI & damage ----------
    let playerHp = s.playerHp
    let hitFlash = Math.max(0, s.hitFlash - dt)
    const goldDrops = s.goldDrops
    let xp = s.xp
    let gold = s.gold
    let level = s.level
    let xpNext = s.xpNext
    let kills = s.kills

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      e.hitFlash = Math.max(0, e.hitFlash - dt)

      // Movement toward player
      const toPlayer = _tmpA.copy(s.playerPos).sub(e.pos).setY(0)
      const dist = toPlayer.length()
      const desired = e.def.attackRange * 0.8
      if (dist > desired) {
        toPlayer.normalize().multiplyScalar(e.def.speed)
        e.vel.lerp(toPlayer, 1 - Math.pow(0.01, dt))
      } else {
        e.vel.lerp(_tmpB.set(0, 0, 0), 1 - Math.pow(0.01, dt))
      }
      // Slight separation
      for (const other of enemies) {
        if (other === e) continue
        const dx = e.pos.x - other.pos.x
        const dz = e.pos.z - other.pos.z
        const d2 = dx * dx + dz * dz
        const minD = e.def.radius + other.def.radius
        if (d2 > 0 && d2 < minD * minD) {
          const d = Math.sqrt(d2)
          const push = ((minD - d) / minD) * 3
          e.vel.x += (dx / d) * push
          e.vel.z += (dz / d) * push
        }
      }
      e.pos.addScaledVector(e.vel, dt)

      // Attacks
      e.attackCd = Math.max(0, e.attackCd - dt)
      if (dist <= e.def.attackRange && e.attackCd <= 0) {
        e.attackCd = e.def.attackCooldown
        if (e.kind === 'wisp') {
          // Ranged fireball
          const dir = toPlayer.clone().normalize()
          projectiles.push({
            id: nid(),
            pos: e.pos.clone().add(new THREE.Vector3(0, 0.8, 0)),
            vel: dir.multiplyScalar(14),
            damage: -e.def.damage * (0.5 + s.stageIndex * 0.1),
            color: '#ff7ad1',
            radius: 0.3,
            pierce: 0,
            life: 2.2,
            age: 0,
            hit: new Set(),
            isCrit: false,
          })
        } else {
          // Melee
          if (dist <= e.def.attackRange && dashTime <= 0) {
            const dmg = e.def.damage * (0.8 + difficultyMult * 0.2)
            playerHp -= dmg
            hitFlash = 0.35
            pushDamageNumber(s.damageNumbers, s.playerPos, dmg, false, '#ff8080')
          }
        }
      }

      if (e.hp <= 0) {
        const dropGold = Math.max(1, Math.floor(e.def.goldValue * (1 + difficultyMult * 0.2) * s.stats.goldMult))
        goldDrops.push({
          id: nid(),
          pos: e.pos.clone(),
          amount: dropGold,
          age: 0,
        })
        xp += e.def.xpValue
        kills += 1
        // heal-on-kill
        playerHp = Math.min(s.stats.maxHp, playerHp + s.stats.healOnKill)
        enemies.splice(i, 1)
        if (e.isBoss) {
          bossDefeated = true
          phase = 'stage_cleared'
        }
      }
    }

    // Enemy projectiles vs player (negative damage == enemy projectile)
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      if (p.damage >= 0) continue
      const d = _tmpB.copy(p.pos).sub(s.playerPos).setY(0).length()
      if (d < 0.9) {
        if (dashTime <= 0) {
          const dmg = -p.damage
          playerHp -= dmg
          hitFlash = 0.35
          pushDamageNumber(s.damageNumbers, s.playerPos, dmg, false, '#ff8080')
        }
        projectiles.splice(i, 1)
      }
    }

    // Regen
    if (playerHp > 0) {
      playerHp = Math.min(s.stats.maxHp, playerHp + s.stats.regenPerSec * dt)
    }

    // ---------- Gold pickup ----------
    for (let i = goldDrops.length - 1; i >= 0; i--) {
      const g = goldDrops[i]
      g.age += dt
      const toPlayer = _tmpA.copy(s.playerPos).sub(g.pos).setY(0)
      const d = toPlayer.length()
      if (d < 5.5) {
        g.pos.addScaledVector(toPlayer.normalize(), 10 * dt * (1 + (5.5 - d)))
      }
      if (d < 0.9) {
        gold += g.amount
        goldDrops.splice(i, 1)
      }
      if (g.age > 60) goldDrops.splice(i, 1)
    }

    // ---------- XP / level up ----------
    while (xp >= xpNext) {
      xp -= xpNext
      level += 1
      xpNext = xpForLevel(level)
      // Level-up: +HP and tiny damage bump, full heal
      s.stats.maxHp += 24
      s.stats.damageMult *= 1.03
      playerHp = s.stats.maxHp
    }

    // ---------- Chest interaction ----------
    const chests = s.chests
    for (const c of chests) {
      if (c.opened) continue
      if (s.playerPos.distanceTo(c.pos) < 1.8 && gold >= c.cost) {
        c.opened = true
        chestsOpenedThisFrame = true
        gold -= c.cost
        const item = rollItem(c.rarity)
        s.addItem(item.id)
        pushDamageNumber(s.damageNumbers, c.pos, 0, true, item.rarity === 'legendary' ? '#ff5fb8' : item.rarity === 'uncommon' ? '#7ec8ff' : '#ffffff')
      }
    }

    // ---------- Teleporter activation ----------
    if (s.teleporterPos && !teleporterActive && !bossSpawned) {
      if (s.playerPos.distanceTo(s.teleporterPos) < 1.8 && stageTime > 10) {
        teleporterActive = true
        phase = 'teleporter_charging'
      }
    }

    // ---------- Damage numbers aging ----------
    for (let i = s.damageNumbers.length - 1; i >= 0; i--) {
      const d = s.damageNumbers[i]
      d.age += dt
      d.pos.y += dt * 1.2
      if (d.age > 1.1) s.damageNumbers.splice(i, 1)
    }

    // ---------- Game over ----------
    if (playerHp <= 0) {
      phase = 'game_over'
    }

    // Bump entityVersion if membership changed, so React renderers that
    // map over these arrays re-render. We mutate arrays in place for perf.
    const membershipChanged =
      enemies.length !== initEnemyCount ||
      goldDrops.length !== initGoldCount ||
      projectiles.length !== initProjCount ||
      chestsOpenedThisFrame
    const nextEntityVersion = membershipChanged ? s.entityVersion + 1 : s.entityVersion

    useGame.setState({
      time,
      stageTime,
      difficultyMult,
      playerHp,
      hitFlash,
      primaryCd,
      cdSecondary,
      cdUtility,
      cdSpecial,
      dashTime,
      xp,
      xpNext,
      level,
      gold,
      kills,
      teleporterCharge,
      teleporterActive,
      bossSpawned,
      bossDefeated,
      phase,
      entityVersion: nextEntityVersion,
    })
  })

  return null
}

function applyDamage(e: Enemy, amount: number, isCrit: boolean) {
  e.hp -= amount
  e.hitFlash = 0.12
  const s = useGame.getState()
  pushDamageNumber(s.damageNumbers, e.pos, amount, isCrit, isCrit ? '#ffd067' : '#ffffff')
}

function chainLightning(originId: number, origin: THREE.Vector3, damage: number, enemies: Enemy[]) {
  let nearest: Enemy | null = null
  let nearestD = 8
  for (const e of enemies) {
    if (e.id === originId) continue
    const d = _fwd.copy(e.pos).sub(origin).setY(0).length()
    if (d < nearestD) {
      nearest = e
      nearestD = d
    }
  }
  if (nearest) applyDamage(nearest, damage, false)
}

function randomSpawnPos(playerPos: THREE.Vector3, R: number): THREE.Vector3 {
  for (let t = 0; t < 20; t++) {
    const a = Math.random() * Math.PI * 2
    const r = R * (0.55 + Math.random() * 0.4)
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
    if (p.distanceTo(playerPos) > 12) return p
  }
  const a = Math.random() * Math.PI * 2
  return new THREE.Vector3(Math.cos(a) * R * 0.9, 0, Math.sin(a) * R * 0.9)
}

// Unused import guard
void ENEMIES
