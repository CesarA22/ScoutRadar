import type { DemoVideoKey } from '../lib/videos'
import type { FilterState, Player } from '../types'
import { clearToken, getToken } from '../auth/token'

/** Empty in local dev (Vite proxy). Set VITE_API_URL on Railway to the backend public URL. */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export type AuthUser = {
  id: number
  username: string
  email?: string | null
  avatar_url?: string | null
  theme?: 'dark' | 'light'
  language?: 'pt' | 'en' | 'es'
}

export type AvailabilityCheck = { username_available: boolean; email_available: boolean }

export type UpdateProfilePayload = {
  username?: string
  email?: string
  current_password?: string
  new_password?: string
  theme?: 'dark' | 'light'
  language?: 'pt' | 'en' | 'es'
}

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BASE}${path}`
}

/** Media played in <video>/<img> — keep same-origin to avoid ORB (use /api/... not cross-origin backend URL). */
export function sameOriginMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

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

async function fetchJson<T>(url: string, init?: RequestInit, opts?: { public?: boolean }): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token && !opts?.public) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  if (res.status === 401 && !opts?.public) {
    clearToken()
    onUnauthorized?.()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    let detail = `API error ${res.status}`
    try {
      const err = await res.json() as { detail?: string }
      if (typeof err.detail === 'string') detail = err.detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  authLogin: (username: string, password: string) =>
    fetchJson<{ access_token: string; token_type: string }>(
      `${BASE}/api/v1/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      },
      { public: true },
    ),

  authMe: () => fetchJson<AuthUser>(`${BASE}/api/v1/auth/me`),

  checkAvailability: (params: { username?: string; email?: string }) => {
    const q = new URLSearchParams()
    if (params.username) q.set('username', params.username)
    if (params.email) q.set('email', params.email)
    return fetchJson<AvailabilityCheck>(`${BASE}/api/v1/auth/check-availability?${q}`)
  },

  updateProfile: (payload: UpdateProfilePayload) =>
    fetchJson<{ user: AuthUser; access_token?: string | null }>(`${BASE}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  uploadAvatar: async (file: File) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${BASE}/api/v1/auth/me/avatar`, { method: 'POST', body: form, headers })
    if (res.status === 401) {
      clearToken()
      onUnauthorized?.()
      throw new Error('Unauthorized')
    }
    if (!res.ok) {
      let detail = `API error ${res.status}`
      try {
        const err = await res.json() as { detail?: string }
        if (typeof err.detail === 'string') detail = err.detail
      } catch { /* ignore */ }
      throw new Error(detail)
    }
    return res.json() as Promise<AuthUser>
  },

  getDemoVideoUrl: (key: DemoVideoKey) =>
    fetchJson<{ key: string; url: string; poster_url?: string | null; expires_in?: number }>(
      `${BASE}/api/v1/demo-videos/${key}`,
      undefined,
      { public: true },
    ),

  contact: (payload: { name: string; email: string; subject: string; message: string }) =>
    fetchJson<{ ok: boolean; message: string }>(
      `${BASE}/api/v1/contact`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      { public: true },
    ),

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

  chat: (message: string, sessionId: string, context: Record<string, unknown>) =>
    fetchJson<{ session_id: string; message_id: string; answer: string; plan: Record<string, unknown>; audit: Record<string, unknown> }>(`${BASE}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, context }),
    }),

  getChatHistory: (sessionId: string) =>
    fetchJson<{ session_id: string; messages: Array<{ id: string; role: string; content: string; timestamp: string; feedback?: string }> }>(
      `${BASE}/api/v1/chat/history/${encodeURIComponent(sessionId)}`
    ),

  chatFeedback: (sessionId: string, messageId: string, rating: 'up' | 'down') =>
    fetchJson<{ ok: boolean }>(`${BASE}/api/v1/chat/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message_id: messageId, rating }),
    }),

  explorerInsight: (payload: Record<string, string>) =>
    fetchJson<{ text: string }>(`${BASE}/api/v1/insights/explorer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  compareInsight: (keys: string[], locale: string) =>
    fetchJson<{ text: string }>(`${BASE}/api/v1/insights/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys, locale }),
    }),

  playerInsight: (key: string, locale: string) =>
    fetchJson<{ text: string }>(`${BASE}/api/v1/insights/player/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }),
}
