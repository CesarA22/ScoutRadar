import { Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ensureSession, setPendingChatMessage, touchChatSession } from '../lib/chatSessions'
import type { Player } from '../types'

interface PlayerAskChatProps {
  player: Player
  compact?: boolean
}

export function PlayerAskChat({ player, compact }: PlayerAskChatProps) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const send = () => {
    const msg = q.trim() || `Analise o jogador ${player.player} (${player.team}, ${player.season})`
    const session = ensureSession()
    touchChatSession(session.id, `Sobre ${player.player}`)
    setPendingChatMessage(session.id, msg)
    navigate('/chat', { state: { sessionId: session.id, message: msg } })
  }

  return (
    <div className={`flex gap-2 ${compact ? '' : 'mt-3 pt-3 border-t border-white/10'}`} onClick={e => e.stopPropagation()}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder={t('ask_about_player', { name: player.player })}
        className={`flex-1 glass rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-fut-emerald/50 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      />
      <button
        type="button"
        onClick={send}
        className={`shrink-0 rounded-lg bg-fut-emerald/90 hover:bg-fut-emerald text-fut-bg flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
      >
        <Send className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    </div>
  )
}
