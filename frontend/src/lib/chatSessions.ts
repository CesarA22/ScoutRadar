export interface PlayerChatContext {
  player_key: string
  player_name: string
  player_team: string
  player_season: number
}

export interface ChatSessionMeta {
  id: string
  title: string
  updatedAt: string
  player?: PlayerChatContext
}

export interface PendingChatPayload {
  sessionId: string
  message: string
  player?: PlayerChatContext
}

const SESSIONS_KEY = 'scoutradar_chat_sessions'
const ACTIVE_KEY = 'scoutradar_chat_active'
export const PENDING_MSG_KEY = 'scoutradar_chat_pending'
const PLAYER_CTX_PREFIX = 'scoutradar_player_ctx_'

function playerSessionTitle(player: PlayerChatContext): string {
  return `${player.player_name} · ${player.player_team}`
}

function saveSessions(list: ChatSessionMeta[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
}

export function listChatSessions(): ChatSessionMeta[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    const list = raw ? (JSON.parse(raw) as ChatSessionMeta[]) : []
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch {
    return []
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveSessionId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function createChatSession(title = 'Nova conversa', player?: PlayerChatContext): ChatSessionMeta {
  const session: ChatSessionMeta = {
    id: crypto.randomUUID(),
    title: player ? playerSessionTitle(player) : title,
    updatedAt: new Date().toISOString(),
    player,
  }
  const list = listChatSessions()
  list.unshift(session)
  saveSessions(list)
  setActiveSessionId(session.id)
  if (player) setSessionPlayerContext(session.id, player)
  return session
}

export function touchChatSession(id: string, title?: string) {
  const list = listChatSessions()
  const idx = list.findIndex(s => s.id === id)
  const prev = idx >= 0 ? list[idx] : null
  const entry: ChatSessionMeta = {
    id,
    title: title ?? prev?.title ?? 'Conversa',
    updatedAt: new Date().toISOString(),
    player: prev?.player,
  }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  saveSessions(list)
}

/** One chat thread per player — reopens existing or creates a new session titled with the player name. */
export function getOrCreatePlayerSession(player: PlayerChatContext): ChatSessionMeta {
  const list = listChatSessions()
  const existing = list.find(s => s.player?.player_key === player.player_key)
  if (existing) {
    const updated: ChatSessionMeta = {
      ...existing,
      title: playerSessionTitle(player),
      updatedAt: new Date().toISOString(),
      player,
    }
    const idx = list.findIndex(s => s.id === existing.id)
    list[idx] = updated
    saveSessions(list)
    setActiveSessionId(existing.id)
    setSessionPlayerContext(existing.id, player)
    return updated
  }
  return createChatSession(playerSessionTitle(player), player)
}

const LEGACY_SESSION_KEY = 'scoutradar_chat_session'

/** One-time migration from older single-session storage. */
export function migrateLegacySession() {
  const legacy = localStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacy) return
  if (!listChatSessions().some(s => s.id === legacy)) {
    touchChatSession(legacy, 'Conversa')
  }
  setActiveSessionId(legacy)
  localStorage.removeItem(LEGACY_SESSION_KEY)
}

export function ensureSession(): ChatSessionMeta {
  const active = getActiveSessionId()
  if (active) {
    const found = listChatSessions().find(s => s.id === active)
    if (found) return found
  }
  return createChatSession()
}

export function setSessionPlayerContext(sessionId: string, player: PlayerChatContext | null) {
  const key = `${PLAYER_CTX_PREFIX}${sessionId}`
  if (player) sessionStorage.setItem(key, JSON.stringify(player))
  else sessionStorage.removeItem(key)

  const list = listChatSessions()
  const idx = list.findIndex(s => s.id === sessionId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], player: player ?? undefined }
    saveSessions(list)
  }
}

export function getSessionPlayerContext(sessionId: string): PlayerChatContext | null {
  try {
    const raw = sessionStorage.getItem(`${PLAYER_CTX_PREFIX}${sessionId}`)
    if (raw) return JSON.parse(raw) as PlayerChatContext
  } catch {
    /* fall through */
  }
  const meta = listChatSessions().find(s => s.id === sessionId)
  return meta?.player ?? null
}

export function setPendingChatMessage(sessionId: string, message: string, player?: PlayerChatContext) {
  const payload: PendingChatPayload = { sessionId, message, player }
  sessionStorage.setItem(PENDING_MSG_KEY, JSON.stringify(payload))
}

export function consumePendingChatMessage(): PendingChatPayload | null {
  const raw = sessionStorage.getItem(PENDING_MSG_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_MSG_KEY)
  try {
    return JSON.parse(raw) as PendingChatPayload
  } catch {
    return null
  }
}
