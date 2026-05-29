import { Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  buildCompareContext,
  getOrCreateCompareSession,
  setPendingChatMessage,
  touchChatSession,
  type CompareChatContext,
} from '../lib/chatSessions'
import type { Player } from '../types'

interface CompareAskChatProps {
  playerA: Player
  playerB: Player
  aiInsight?: string
}

export function CompareAskChat({ playerA, playerB, aiInsight }: CompareAskChatProps) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const send = () => {
    const ctx: CompareChatContext = {
      ...buildCompareContext(playerA, playerB),
      ai_insight: aiInsight,
    }
    const trimmed = q.trim()
    const msg = trimmed
      ? `${trimmed} (${playerA.player} vs ${playerB.player})`
      : `Analise a comparação entre ${playerA.player} (${playerA.team}) e ${playerB.player} (${playerB.team})`
    const session = getOrCreateCompareSession(ctx)
    touchChatSession(session.id, `${playerA.player} vs ${playerB.player}`)
    setPendingChatMessage(session.id, msg, { compare: ctx })
    navigate('/chat', { state: { sessionId: session.id, message: msg, compare: ctx } })
  }

  return (
    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder={t('ask_about_compare', { a: playerA.player, b: playerB.player })}
        className="flex-1 glass rounded-xl px-4 py-3 lg:px-5 lg:py-3.5 text-sm lg:text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-fut-emerald/50"
      />
      <button
        type="button"
        onClick={send}
        className="shrink-0 w-10 h-10 rounded-lg bg-fut-emerald/90 hover:bg-fut-emerald text-fut-bg flex items-center justify-center"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
