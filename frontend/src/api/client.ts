import type { FilterState, Player } from '../types'

const BASE = ''

function buildParams(filters: Partial<FilterState>, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams()
  filters.seasons?.forEach(s => params.append('season', String(s)))
  filters.positionGroups?.forEach(p => params.append('position_group', p))
  filters.teams?.forEach(t => params.append('team', t))
  filters.clusters?.forEach(c => params.append('cluster', String(c)))
  if (filters.ageMax != null) params.set('age_max', String(filters.ageMax))
  if (filters.minutesMin != null) params.set('minutes_min', String(filters.minutesMin))
  Object.entries(extra).forEach(([k, v]) => { if (v != null) params.set(k, String(v)) })
  return params
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  getPlayers: (filters: Partial<FilterState>, limit = 500) =>
    fetchJson<{ items: Player[]; total: number }>(`${BASE}/api/v1/players?${buildParams(filters, { limit })}`),

  getPlayer: (key: string) => fetchJson<Player>(`${BASE}/api/v1/players/${encodeURIComponent(key)}`),

  searchPlayers: (q: string) => fetchJson<Player[]>(`${BASE}/api/v1/players/search?q=${encodeURIComponent(q)}`),

  compare: (keys: string[]) =>
    fetchJson<{ player_a: Player; player_b: Player; metrics: Record<string, { a: number; b: number }> }>(
      `${BASE}/api/v1/players/compare?keys=${keys.map(encodeURIComponent).join(',')}`
    ),

  getOutliers: (filters: Partial<FilterState>, metric = 'prospect_score', k = 25) =>
    fetchJson<Player[]>(`${BASE}/api/v1/outliers?${buildParams(filters, { metric, k })}`),

  getFilters: () => fetchJson<{ seasons: number[]; teams: string[]; clusters: number[]; position_groups: string[] }>(`${BASE}/api/v1/filters`),

  getDatasetStatus: () => fetchJson<{ active: boolean; source?: string; row_count: number; seasons: number[] }>(`${BASE}/api/v1/dataset/status`),

  chat: (message: string, context: Record<string, unknown>) =>
    fetchJson<{ answer: string; plan: Record<string, unknown>; audit: Record<string, unknown> }>(`${BASE}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    }),

  explorerInsight: (payload: Record<string, string>) =>
    fetchJson<{ text: string }>(`${BASE}/api/v1/insights/explorer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  playerInsight: (key: string, locale: string) =>
    fetchJson<{ text: string }>(`${BASE}/api/v1/insights/player/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }),
}
