export interface ChatSessionMeta {
  id: string
  title: string
  updatedAt: string
}

const SESSIONS_KEY = 'scoutradar_chat_sessions'
const ACTIVE_KEY = 'scoutradar_chat_active'
export const PENDING_MSG_KEY = 'scoutradar_chat_pending'

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

export function createChatSession(title = 'Nova conversa'): ChatSessionMeta {
  const session: ChatSessionMeta = {
    id: crypto.randomUUID(),
    title,
    updatedAt: new Date().toISOString(),
  }
  const list = listChatSessions()
  list.unshift(session)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
  setActiveSessionId(session.id)
  return session
}

export function touchChatSession(id: string, title?: string) {
  const list = listChatSessions()
  const idx = list.findIndex(s => s.id === id)
  const entry: ChatSessionMeta = {
    id,
    title: title ?? list[idx]?.title ?? 'Conversa',
    updatedAt: new Date().toISOString(),
  }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
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

export function setPendingChatMessage(sessionId: string, message: string) {
  sessionStorage.setItem(PENDING_MSG_KEY, JSON.stringify({ sessionId, message }))
}

export function consumePendingChatMessage(): { sessionId: string; message: string } | null {
  const raw = sessionStorage.getItem(PENDING_MSG_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_MSG_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
