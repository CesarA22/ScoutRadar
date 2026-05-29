import { Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getOrCreatePlayerSession,
  setPendingChatMessage,
  touchChatSession,
  type PlayerChatContext,
} from '../lib/chatSessions'
import type { Player } from '../types'

interface PlayerAskChatProps {
  player: Player
  compact?: boolean
}

function toPlayerContext(player: Player): PlayerChatContext {
  return {
    player_key: player.player_key,
    player_name: player.player,
    player_team: player.team,
    player_season: player.season,
  }
}

export function PlayerAskChat({ player, compact }: PlayerAskChatProps) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const send = () => {
    const ctx = toPlayerContext(player)
    const trimmed = q.trim()
    const msg = trimmed
      ? `${trimmed} (${player.player}, ${player.team}, ${player.season})`
      : `Analise o jogador ${player.player} (${player.team}, ${player.season})`
    const session = getOrCreatePlayerSession(ctx)
    touchChatSession(session.id, `${player.player} · ${player.team}`)
    setPendingChatMessage(session.id, msg, { player: ctx })
    navigate('/chat', { state: { sessionId: session.id, message: msg, player: ctx } })
  }

  return (
    <div className={`flex gap-2 ${compact ? '' : 'mt-3 pt-3 border-t border-white/10'}`} onClick={e => e.stopPropagation()}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder={t('ask_about_player', { name: player.player })}
        className={`flex-1 glass rounded-xl px-4 py-3 lg:px-5 lg:py-3.5 text-sm lg:text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-fut-emerald/50 ${compact ? 'px-3 py-2 text-xs sm:text-sm' : ''}`}
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
