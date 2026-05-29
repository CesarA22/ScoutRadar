import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { PlayerCard } from '../components/PlayerCard'
import { ScatterMap } from '../components/ScatterMap'
import { useFilters } from '../hooks/useFilters'
import type { Player } from '../types'

export function ExplorerPage() {
  const { t, i18n } = useTranslation()
  const { filters } = useFilters()
  const [selected, setSelected] = useState<Player | null>(null)
  const [insight, setInsight] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => api.getPlayers(filters),
  })

  const insightMutation = useMutation({
    mutationFn: () => {
      const items = data?.items ?? []
      const top = [...items].sort((a, b) => (b.prospect_score ?? 0) - (a.prospect_score ?? 0)).slice(0, 10)
      return api.explorerInsight({
        locale: i18n.language,
        filter_desc: JSON.stringify(filters),
        top_prospects: top.map(p => `${p.player} (${p.prospect_score?.toFixed(2)})`).join(', '),
        by_team: '',
        by_position: '',
      })
    },
    onSuccess: res => setInsight(res.text),
  })

  const playerInsightMutation = useMutation({
    mutationFn: (key: string) => api.playerInsight(key, i18n.language),
    onSuccess: res => setInsight(res.text),
  })

  if (isLoading) return <p className="text-text-secondary">{t('loading')}</p>

  const players = data?.items ?? []
  if (!players.length) return <p className="text-text-secondary">{t('no_players')}</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('explorer')}</h2>
          <p className="text-text-secondary text-sm">{players.length} {t('players_shown')}. {t('click_hint')}</p>
        </div>
        <button className="btn-primary" onClick={() => insightMutation.mutate()} disabled={insightMutation.isPending}>
          {insightMutation.isPending ? t('loading') : t('ai_insights')}
        </button>
      </div>

      {insight && !selected && (
        <div className="card text-sm whitespace-pre-wrap">{insight}</div>
      )}

      <div className="card h-[500px]">
        <ScatterMap players={players} onSelect={setSelected} selectedKey={selected?.player_key} />
      </div>

      {selected && (
        <PlayerCard
          player={selected}
          onClose={() => { setSelected(null); setInsight('') }}
          onInsight={() => playerInsightMutation.mutate(selected.player_key)}
          insight={insight}
          loadingInsight={playerInsightMutation.isPending}
        />
      )}
    </div>
  )
}
