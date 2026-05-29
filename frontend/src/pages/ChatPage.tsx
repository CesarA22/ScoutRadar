import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Plus, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import {
  consumePendingChatMessage,
  createChatSession,
  getActiveSessionId,
  getSessionPlayerContext,
  listChatSessions,
  migrateLegacySession,
  setActiveSessionId,
  setSessionPlayerContext,
  touchChatSession,
  type ChatSessionMeta,
  type PlayerChatContext,
} from '../lib/chatSessions'
import { Button, GlassCard, Spinner } from '../components/ui'
import { useFilters } from '../hooks/useFilters'
import type { ChatMessage } from '../types'

export function ChatPage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<ChatSessionMeta[]>(() => {
    migrateLegacySession()
    return listChatSessions()
  })
  const [sessionId, setSessionId] = useState(() => {
    migrateLegacySession()
    return getActiveSessionId() ?? createChatSession().id
  })
  const [playerContext, setPlayerContext] = useState<PlayerChatContext | null>(
    () => getSessionPlayerContext(getActiveSessionId() ?? ''),
  )
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showAudit, setShowAudit] = useState<number | null>(null)

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId
  const playerContextRef = useRef(playerContext)
  playerContextRef.current = playerContext
  const pendingSendRef = useRef(false)
  const handledNavKeyRef = useRef<string | null>(null)

  const refreshSessions = useCallback(() => setSessions(listChatSessions()), [])

  const buildChatContext = useCallback(() => {
    const ctx = playerContextRef.current
    const base: Record<string, unknown> = {
      season: ctx?.player_season ?? filters.seasons[0] ?? 2024,
      position_group: filters.positionGroups[0] ?? 'CM_AM',
      age_max: filters.ageMax,
      minutes_min: filters.minutesMin,
    }
    if (ctx) {
      base.player_key = ctx.player_key
      base.player_name = ctx.player_name
      base.player_team = ctx.player_team
      base.player_season = ctx.player_season
    }
    return base
  }, [filters])

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: () => api.getChatHistory(sessionId),
  })

  const chatMutation = useMutation({
    mutationFn: ({ msg, sid }: { msg: string; sid: string }) =>
      api.chat(msg, sid, buildChatContext()),
    onSuccess: (_, { msg, sid }) => {
      setInput('')
      const ctx = playerContextRef.current
      touchChatSession(sid, ctx ? `${ctx.player_name} · ${ctx.player_team}` : msg.slice(0, 40))
      refreshSessions()
      queryClient.invalidateQueries({ queryKey: ['chat-history', sid] })
    },
  })

  const feedbackMutation = useMutation({
    mutationFn: ({ messageId, rating }: { messageId: string; rating: 'up' | 'down' }) =>
      api.chatFeedback(sessionId, messageId, rating),
    onSuccess: (_, { messageId, rating }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: rating } : m))
    },
  })

  useEffect(() => {
    if (!historyData?.messages) return
    if (pendingSendRef.current && chatMutation.isPending) return
    pendingSendRef.current = false
    setMessages(historyData.messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      feedback: (m.feedback as 'up' | 'down') ?? null,
    })))
  }, [historyData, chatMutation.isPending])

  const sendMessage = useCallback((text: string, sid?: string) => {
    const trimmed = text.trim()
    const targetSid = sid ?? sessionIdRef.current
    if (!trimmed || chatMutation.isPending) return
    pendingSendRef.current = true
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    chatMutation.mutate({ msg: trimmed, sid: targetSid })
  }, [chatMutation])

  const sendMessageRef = useRef(sendMessage)
  sendMessageRef.current = sendMessage

  // Handle navigation from player modal — once per location.key only.
  useEffect(() => {
    const navKey = location.key
    if (handledNavKeyRef.current === navKey) return

    const pending = consumePendingChatMessage()
    const state = location.state as {
      sessionId?: string
      message?: string
      player?: PlayerChatContext
    } | null

    const targetSession = pending?.sessionId ?? state?.sessionId
    const messageToSend = pending?.message ?? state?.message
    const player = pending?.player ?? state?.player

    if (!targetSession && !messageToSend) return

    handledNavKeyRef.current = navKey
    navigate(location.pathname, { replace: true, state: null })

    if (targetSession) {
      setSessionId(targetSession)
      setActiveSessionId(targetSession)
    }
    if (player && targetSession) {
      setPlayerContext(player)
      setSessionPlayerContext(targetSession, player)
    }
    refreshSessions()

    if (messageToSend && targetSession) {
      queueMicrotask(() => sendMessageRef.current(messageToSend, targetSession))
    }
  }, [location.key, location.pathname, navigate, refreshSessions])

  useEffect(() => {
    setPlayerContext(getSessionPlayerContext(sessionId))
  }, [sessionId])

  const selectSession = (id: string) => {
    handledNavKeyRef.current = location.key
    setSessionId(id)
    setActiveSessionId(id)
    setMessages([])
    setPlayerContext(getSessionPlayerContext(id))
  }

  const startNewSession = () => {
    const s = createChatSession()
    refreshSessions()
    handledNavKeyRef.current = location.key
    setSessionId(s.id)
    setMessages([])
    setInput('')
    setPlayerContext(null)
    setSessionPlayerContext(s.id, null)
  }

  const clearPlayerContext = () => {
    setPlayerContext(null)
    setSessionPlayerContext(sessionId, null)
  }

  const handleSend = () => sendMessage(input)

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] max-w-6xl mx-auto">
      <aside className="w-56 shrink-0 glass rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-fut-emerald" />
            {t('chat')}
          </h2>
        </div>
        <div className="p-2">
          <button
            type="button"
            onClick={startNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-fut-emerald/15 hover:bg-fut-emerald/25 text-fut-emerald border border-fut-emerald/30"
          >
            <Plus className="w-4 h-4" />
            {t('new_chat')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSession(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                s.id === sessionId
                  ? 'bg-fut-gold/15 text-fut-gold border border-fut-gold/30'
                  : 'hover:bg-white/5 text-white/70'
              }`}
            >
              {s.title}
            </button>
          ))}
          {!sessions.length && (
            <p className="text-xs text-white/30 px-2 py-4">{t('chat_empty_sessions')}</p>
          )}
        </div>
      </aside>

      <GlassCard className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden p-0">
        {playerContext && (
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-2 bg-fut-emerald/5">
            <p className="text-xs text-white/70 truncate">
              {t('chat_about_player', {
                name: playerContext.player_name,
                team: playerContext.player_team,
                season: playerContext.player_season,
              })}
            </p>
            <button
              type="button"
              onClick={clearPlayerContext}
              className="shrink-0 p-1 rounded hover:bg-white/10 text-white/40"
              title={t('chat_clear_player')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoading && messages.length === 0 && !chatMutation.isPending && (
            <div className="flex justify-center py-12"><Spinner /></div>
          )}
          {!historyLoading && messages.length === 0 && !chatMutation.isPending && (
            <p className="text-white/30 text-sm text-center py-12">{t('chat_placeholder')}</p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={m.id ?? `msg-${i}`}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-fut-emerald/30 to-fut-emerald-dim/20 border border-fut-emerald/30'
                      : 'glass border border-white/10'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                    {m.role === 'user' ? t('chat_you') : t('chat_assistant')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-white/90">{m.content}</p>
                  {m.role === 'assistant' && m.id && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => feedbackMutation.mutate({ messageId: m.id!, rating: 'up' })}
                        className={`p-1.5 rounded-lg transition-colors ${m.feedback === 'up' ? 'bg-fut-emerald/30 text-fut-emerald' : 'hover:bg-white/10 text-white/40'}`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => feedbackMutation.mutate({ messageId: m.id!, rating: 'down' })}
                        className={`p-1.5 rounded-lg transition-colors ${m.feedback === 'down' ? 'bg-red-500/30 text-red-400' : 'hover:bg-white/10 text-white/40'}`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      {m.audit && (
                        <button type="button" onClick={() => setShowAudit(showAudit === i ? null : i)} className="text-xs text-fut-gold ml-auto">
                          {t('audit')}
                        </button>
                      )}
                    </div>
                  )}
                  {showAudit === i && m.audit && (
                    <pre className="text-[10px] mt-2 p-2 rounded bg-black/40 overflow-x-auto text-white/50">{JSON.stringify(m.audit, null, 2)}</pre>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center text-white/40 text-sm">
              <Spinner className="w-5 h-5" />
              {t('chat_thinking')}
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-2">
          <input
            className="flex-1 glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-fut-gold/50"
            placeholder={
              playerContext
                ? t('ask_about_player', { name: playerContext.player_name })
                : t('chat_input_placeholder')
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <Button variant="gold" onClick={handleSend} disabled={chatMutation.isPending}>
            <Send className="w-4 h-4" />
            {t('send')}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
