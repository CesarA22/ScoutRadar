import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Map, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { ExplorerCharts } from '../components/ExplorerCharts'
import { PlayerCardModal } from '../components/PlayerCardModal'
import { ScatterMap } from '../components/ScatterMap'
import { Button, CountUp, GlassCard, Spinner } from '../components/ui'
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

  const players = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center fill-main gap-4">
        <Spinner className="w-10 h-10" />
        <p className="text-white/40 text-base">{t('loading')}</p>
      </div>
    )
  }

  if (!players.length) {
    return (
      <GlassCard className="text-center py-20 lg:py-28">
        <Map className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 text-lg">{t('no_players')}</p>
      </GlassCard>
    )
  }

  return (
    <div className="page-shell fill-main flex flex-col">
      <div className="flex flex-wrap justify-between items-end gap-4 shrink-0">
        <div>
          <h2 className="page-title text-white">{t('explorer')}</h2>
          <p className="page-subtitle">
            <CountUp value={players.length} className="text-fut-emerald font-stats font-bold text-lg" /> {t('players_shown')}
          </p>
        </div>
        <Button variant="gold" className="text-base lg:text-lg px-6 py-3" loading={insightMutation.isPending} onClick={() => insightMutation.mutate()}>
          <Sparkles className="w-5 h-5" />
          {t('ai_insights')}
        </Button>
      </div>

      <ExplorerCharts players={players} />

      {insight && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="shrink-0">
          <GlassCard className="border border-fut-gold/20 text-base lg:text-lg text-white/80 whitespace-pre-wrap leading-relaxed">{insight}</GlassCard>
        </motion.div>
      )}

      <GlassCard className="flex-1 min-h-[min(420px,calc(100dvh-16rem))] lg:min-h-[min(560px,calc(100dvh-18rem))] xl:min-h-[min(640px,calc(100dvh-20rem))] p-2 lg:p-3 gradient-border">
        <ScatterMap players={players} onSelect={setSelected} selectedKey={selected?.player_key} />
      </GlassCard>

      <PlayerCardModal player={selected} allPlayers={players} onClose={() => setSelected(null)} />
    </div>
  )
}
