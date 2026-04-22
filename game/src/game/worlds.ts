import type { WorldDef } from './types'

// Starter world. Additional worlds can be added here and the teleporter
// will transport you to `nextWorld`.
export const DISTANT_ROOST: WorldDef = {
  id: 'distant_roost',
  name: 'Distant Roost',
  subtitle: 'Floating sky islands',
  ambient: '#b9d7ff',
  fog: '#8cb6e8',
  ground: '#4a7a5f',
  accent: '#c9e2a8',
  skyTop: '#5d8fc7',
  skyBottom: '#b9d7ff',
  arenaRadius: 44,
  propCount: 36,
  nextWorld: 'scorched_acres',
}

export const SCORCHED_ACRES: WorldDef = {
  id: 'scorched_acres',
  name: 'Scorched Acres',
  subtitle: 'Burning fields',
  ambient: '#ffc194',
  fog: '#c76d44',
  ground: '#6b2d1c',
  accent: '#ff8b4d',
  skyTop: '#7a2a1e',
  skyBottom: '#e07a3c',
  arenaRadius: 48,
  propCount: 42,
  nextWorld: 'abyssal_depths',
}

export const ABYSSAL_DEPTHS: WorldDef = {
  id: 'abyssal_depths',
  name: 'Abyssal Depths',
  subtitle: 'The dark below',
  ambient: '#7a6bff',
  fog: '#2a1b4a',
  ground: '#1a1530',
  accent: '#b07bff',
  skyTop: '#120a24',
  skyBottom: '#2a1b4a',
  arenaRadius: 52,
  propCount: 48,
  nextWorld: 'distant_roost', // loops with higher difficulty
}

export const WORLDS: WorldDef[] = [DISTANT_ROOST, SCORCHED_ACRES, ABYSSAL_DEPTHS]

export function getWorld(id: string): WorldDef {
  return WORLDS.find((w) => w.id === id) ?? DISTANT_ROOST
}
