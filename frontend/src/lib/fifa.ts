import type { Player } from '../types'

export type FifaAttr = 'PAC' | 'SHO' | 'PAS' | 'DRI' | 'DEF' | 'PHY'
export type CardTier = 'special' | 'gold' | 'silver' | 'bronze'

export interface FifaAttributes {
  PAC: number
  SHO: number
  PAS: number
  DRI: number
  DEF: number
  PHY: number
}

export interface FifaCardData {
  overall: number
  attrs: FifaAttributes
  tier: CardTier
  positionShort: string
}

const ATTR_KEYS: FifaAttr[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']

const METRIC_MAP: Record<FifaAttr, string[]> = {
  PAC: ['prog_carries_per90'],
  SHO: ['goals_per90', 'xg_per90', 'shots_per90'],
  PAS: ['assists_per90', 'xa_per90', 'prog_passes_per90', 'pass_accuracy'],
  DRI: ['prog_carries_per90', 'touches_box_per90'],
  DEF: ['tackles_per90', 'interceptions_per90', 'pressures_per90'],
  PHY: ['aerial_won_per90', 'minutes'],
}

const POSITION_WEIGHTS: Record<string, Partial<Record<FifaAttr, number>>> = {
  GK: { DEF: 1.4, PHY: 1.2, PAS: 0.8 },
  CB: { DEF: 1.5, PHY: 1.3, PAC: 0.7 },
  FB: { PAC: 1.2, DEF: 1.1, PAS: 1.0 },
  DM: { DEF: 1.2, PAS: 1.2, PHY: 1.1 },
  CM_AM: { PAS: 1.2, DRI: 1.1, SHO: 1.0 },
  W: { PAC: 1.3, DRI: 1.2, SHO: 1.0 },
  ST: { SHO: 1.4, PAC: 1.1, PHY: 1.0 },
}

const POS_SHORT: Record<string, string> = {
  GK: 'GK', CB: 'CB', FB: 'LB', DM: 'CDM', CM_AM: 'CM', W: 'LW', ST: 'ST',
}

function getMetric(player: Player, key: string): number | undefined {
  const m = player.metrics?.[key]
  if (m != null && !Number.isNaN(m)) return m
  const top = (player as unknown as Record<string, unknown>)[key]
  return typeof top === 'number' ? top : undefined
}

function percentileRank(value: number, pool: number[]): number {
  if (pool.length === 0) return 50
  const sorted = [...pool].sort((a, b) => a - b)
  const below = sorted.filter(v => v < value).length
  const equal = sorted.filter(v => v === value).length
  const pct = ((below + equal * 0.5) / sorted.length) * 100
  return Math.min(99, Math.max(1, Math.round(pct)))
}

function buildPools(players: Player[], positionGroup?: string): Record<string, number[]> {
  const filtered = positionGroup
    ? players.filter(p => p.position_group === positionGroup)
    : players
  const pools: Record<string, number[]> = {}
  const allKeys = new Set<string>()
  ATTR_KEYS.forEach(a => METRIC_MAP[a].forEach(k => allKeys.add(k)))

  allKeys.forEach(key => {
    pools[key] = filtered
      .map(p => getMetric(p, key))
      .filter((v): v is number => v != null)
  })
  return pools
}

function attrFromMetrics(player: Player, attr: FifaAttr, pools: Record<string, number[]>): number {
  const keys = METRIC_MAP[attr]
  const scores: number[] = []
  keys.forEach(key => {
    const v = getMetric(player, key)
    const pool = pools[key] ?? []
    if (v != null && pool.length > 0) scores.push(percentileRank(v, pool))
  })
  if (scores.length === 0) return 50
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function computeFifaCard(player: Player, allPlayers: Player[]): FifaCardData {
  const pools = buildPools(allPlayers, player.position_group)
  const attrs: FifaAttributes = {
    PAC: attrFromMetrics(player, 'PAC', pools),
    SHO: attrFromMetrics(player, 'SHO', pools),
    PAS: attrFromMetrics(player, 'PAS', pools),
    DRI: attrFromMetrics(player, 'DRI', pools),
    DEF: attrFromMetrics(player, 'DEF', pools),
    PHY: attrFromMetrics(player, 'PHY', pools),
  }

  const weights = POSITION_WEIGHTS[player.position_group] ?? {}
  let totalW = 0
  let weighted = 0
  ATTR_KEYS.forEach(k => {
    const w = weights[k] ?? 1
    weighted += attrs[k] * w
    totalW += w
  })
  const overall = Math.round(weighted / totalW)

  let tier: CardTier = 'bronze'
  if (overall >= 85) tier = 'special'
  else if (overall >= 75) tier = 'gold'
  else if (overall >= 65) tier = 'silver'

  return {
    overall,
    attrs,
    tier,
    positionShort: POS_SHORT[player.position_group] ?? player.position_group.slice(0, 3).toUpperCase(),
  }
}

export const TIER_STYLES: Record<CardTier, { gradient: string; border: string; glow: string; text: string }> = {
  special: {
    gradient: 'linear-gradient(145deg, #1a1a2e 0%, #2d2d44 40%, #f4cf6b 120%)',
    border: 'rgba(244, 207, 107, 0.6)',
    glow: 'shadow-glow-special',
    text: '#f4cf6b',
  },
  gold: {
    gradient: 'linear-gradient(145deg, #3d2e0a 0%, #c9a23a 50%, #f4cf6b 100%)',
    border: 'rgba(244, 207, 107, 0.5)',
    glow: 'shadow-glow-gold',
    text: '#1a1408',
  },
  silver: {
    gradient: 'linear-gradient(145deg, #4a4a52 0%, #c0c0c0 50%, #e8e8e8 100%)',
    border: 'rgba(192, 192, 192, 0.5)',
    glow: 'shadow-card',
    text: '#2a2a30',
  },
  bronze: {
    gradient: 'linear-gradient(145deg, #3d2817 0%, #cd7f32 60%, #e8a55c 100%)',
    border: 'rgba(205, 127, 50, 0.5)',
    glow: 'shadow-card',
    text: '#2a1a0a',
  },
}

export const CLUSTER_COLORS = ['#10d979', '#f4cf6b', '#5b8def', '#ef4444', '#ec4899', '#06b6d4', '#a855f7', '#f59e0b']
