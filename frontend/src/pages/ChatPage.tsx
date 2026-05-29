import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useFilters } from '../hooks/useFilters'
import type { ChatMessage } from '../types'

export function ChatPage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showAudit, setShowAudit] = useState<number | null>(null)

  const chatMutation = useMutation({
    mutationFn: (msg: string) =>
      api.chat(msg, {
        season: filters.seasons[0] ?? 2024,
        position_group: filters.positionGroups[0] ?? 'CM_AM',
        age_max: filters.ageMax,
        minutes_min: filters.minutesMin,
      }),
    onSuccess: (res, msg) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'assistant', content: res.answer, audit: { plan: res.plan, ...res.audit } },
      ])
      setInput('')
    },
  })

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || chatMutation.isPending) return
    chatMutation.mutate(trimmed)
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)]">
      <h2 className="text-2xl font-bold">{t('chat')}</h2>

      <div className="flex-1 card overflow-y-auto space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-text-muted text-sm">
            Pergunte sobre jogadores, comparações, top rankings ou metodologia.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-accent/20 ml-8' : 'bg-bg-elevated mr-8'}`}>
            <p className="text-xs text-text-muted mb-1">{m.role === 'user' ? 'Você' : 'Scout Radar'}</p>
            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            {m.audit && (
              <button className="text-xs text-accent mt-2" onClick={() => setShowAudit(showAudit === i ? null : i)}>
                {t('audit')}
              </button>
            )}
            {showAudit === i && m.audit && (
              <pre className="text-xs mt-2 bg-bg-primary p-2 rounded overflow-x-auto">{JSON.stringify(m.audit, null, 2)}</pre>
            )}
          </div>
        ))}
        {chatMutation.isPending && <p className="text-text-muted text-sm">{t('loading')}</p>}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ex: compare jogador 1 com jogador 2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="btn-primary" onClick={handleSend} disabled={chatMutation.isPending}>
          {t('send')}
        </button>
      </div>
    </div>
  )
}
