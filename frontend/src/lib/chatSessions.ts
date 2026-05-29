export interface PlayerChatContext {
  player_key: string
  player_name: string
  player_team: string
  player_season: number
}

export interface CompareChatContext {
  compare_key: string
  player_a_key: string
  player_a_name: string
  player_a_team: string
  player_b_key: string
  player_b_name: string
  player_b_team: string
  season: number
  ai_insight?: string
}

export interface ChatSessionMeta {
  id: string
  title: string
  updatedAt: string
  player?: PlayerChatContext
  compare?: CompareChatContext
  archived?: boolean
}

export interface PendingChatPayload {
  sessionId: string
  message: string
  player?: PlayerChatContext
  compare?: CompareChatContext
}

const SESSIONS_KEY = 'scoutradar_chat_sessions'
const ACTIVE_KEY = 'scoutradar_chat_active'
export const PENDING_MSG_KEY = 'scoutradar_chat_pending'
const PLAYER_CTX_PREFIX = 'scoutradar_player_ctx_'
const COMPARE_CTX_PREFIX = 'scoutradar_compare_ctx_'

function playerSessionTitle(player: PlayerChatContext): string {
  return `${player.player_name} · ${player.player_team}`
}

function compareSessionTitle(c: CompareChatContext): string {
  return `${c.player_a_name} vs ${c.player_b_name}`
}

export function buildCompareKey(keyA: string, keyB: string): string {
  return [keyA, keyB].sort().join('::')
}

export function buildCompareContext(
  pa: { player_key: string; player: string; team: string; season: number },
  pb: { player_key: string; player: string; team: string; season: number },
): CompareChatContext {
  return {
    compare_key: buildCompareKey(pa.player_key, pb.player_key),
    player_a_key: pa.player_key,
    player_a_name: pa.player,
    player_a_team: pa.team,
    player_b_key: pb.player_key,
    player_b_name: pb.player,
    player_b_team: pb.team,
    season: pa.season,
  }
}

function saveSessions(list: ChatSessionMeta[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
}

function allSessionsRaw(): ChatSessionMeta[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as ChatSessionMeta[]) : []
  } catch {
    return []
  }
}

export function listChatSessions(includeArchived = false): ChatSessionMeta[] {
  return allSessionsRaw()
    .filter(s => (includeArchived ? s.archived : !s.archived))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function listArchivedChatSessions(): ChatSessionMeta[] {
  return listChatSessions(true)
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
  const list = allSessionsRaw()
  list.unshift(session)
  saveSessions(list)
  setActiveSessionId(session.id)
  if (player) setSessionPlayerContext(session.id, player)
  return session
}

export function touchChatSession(id: string, title?: string) {
  const list = allSessionsRaw()
  const idx = list.findIndex(s => s.id === id)
  const prev = idx >= 0 ? list[idx] : null
  const entry: ChatSessionMeta = {
    id,
    title: title ?? prev?.title ?? 'Conversa',
    updatedAt: new Date().toISOString(),
    player: prev?.player,
    compare: prev?.compare,
    archived: prev?.archived,
  }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  saveSessions(list)
}

export function archiveChatSession(id: string) {
  const list = allSessionsRaw()
  const idx = list.findIndex(s => s.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], archived: true, updatedAt: new Date().toISOString() }
  saveSessions(list)
}

export function unarchiveChatSession(id: string) {
  const list = allSessionsRaw()
  const idx = list.findIndex(s => s.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], archived: false, updatedAt: new Date().toISOString() }
  saveSessions(list)
}

export function deleteChatSession(id: string) {
  const list = allSessionsRaw().filter(s => s.id !== id)
  saveSessions(list)
  sessionStorage.removeItem(`${PLAYER_CTX_PREFIX}${id}`)
  sessionStorage.removeItem(`${COMPARE_CTX_PREFIX}${id}`)
  if (getActiveSessionId() === id) {
    const next = list.find(s => !s.archived) ?? list[0]
    if (next) setActiveSessionId(next.id)
    else localStorage.removeItem(ACTIVE_KEY)
  }
}

/** One chat thread per player — reopens existing or creates a new session titled with the player name. */
export function getOrCreatePlayerSession(player: PlayerChatContext): ChatSessionMeta {
  const list = allSessionsRaw()
  const existing = list.find(s => s.player?.player_key === player.player_key && !s.archived)
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

/** One chat thread per player pair — reopens existing or creates a new compare session. */
export function getOrCreateCompareSession(compare: CompareChatContext): ChatSessionMeta {
  const list = allSessionsRaw()
  const existing = list.find(s => s.compare?.compare_key === compare.compare_key && !s.archived)
  if (existing) {
    const updated: ChatSessionMeta = {
      ...existing,
      title: compareSessionTitle(compare),
      updatedAt: new Date().toISOString(),
      compare,
      player: undefined,
    }
    const idx = list.findIndex(s => s.id === existing.id)
    list[idx] = updated
    saveSessions(list)
    setActiveSessionId(existing.id)
    setSessionCompareContext(existing.id, compare)
    return updated
  }
  const session: ChatSessionMeta = {
    id: crypto.randomUUID(),
    title: compareSessionTitle(compare),
    updatedAt: new Date().toISOString(),
    compare,
  }
  list.unshift(session)
  saveSessions(list)
  setActiveSessionId(session.id)
  setSessionCompareContext(session.id, compare)
  return session
}

const LEGACY_SESSION_KEY = 'scoutradar_chat_session'

/** One-time migration from older single-session storage. */
export function migrateLegacySession() {
  const legacy = localStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacy) return
  if (!listChatSessions(true).some(s => s.id === legacy)) {
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

  const list = allSessionsRaw()
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
  const meta = allSessionsRaw().find(s => s.id === sessionId)
  return meta?.player ?? null
}

export function getSessionCompareContext(sessionId: string): CompareChatContext | null {
  try {
    const raw = sessionStorage.getItem(`${COMPARE_CTX_PREFIX}${sessionId}`)
    if (raw) return JSON.parse(raw) as CompareChatContext
  } catch {
    /* fall through */
  }
  const meta = allSessionsRaw().find(s => s.id === sessionId)
  return meta?.compare ?? null
}

export function setSessionCompareContext(sessionId: string, compare: CompareChatContext | null) {
  const key = `${COMPARE_CTX_PREFIX}${sessionId}`
  if (compare) sessionStorage.setItem(key, JSON.stringify(compare))
  else sessionStorage.removeItem(key)

  const list = allSessionsRaw()
  const idx = list.findIndex(s => s.id === sessionId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], compare: compare ?? undefined }
    saveSessions(list)
  }
}

export function setPendingChatMessage(
  sessionId: string,
  message: string,
  opts?: { player?: PlayerChatContext; compare?: CompareChatContext },
) {
  const payload: PendingChatPayload = { sessionId, message, ...opts }
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
