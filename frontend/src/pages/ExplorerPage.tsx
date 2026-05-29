import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Map, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { ExplorerCharts } from '../components/ExplorerCharts'
import { PlayerCardModal } from '../components/PlayerCardModal'
import { ScatterMap } from '../components/ScatterMap'
import { Button, GlassCard, Spinner } from '../components/ui'
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
      <div className="flex flex-col items-center justify-center min-h-[360px] gap-4">
        <Spinner />
        <p className="text-white/40 text-sm">{t('loading')}</p>
      </div>
    )
  }

  if (!players.length) {
    return (
      <GlassCard className="text-center py-16">
        <Map className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">{t('no_players')}</p>
      </GlassCard>
    )
  }

  return (
    <div className="page-shell">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="page-title text-white">{t('explorer')}</h2>
        <Button variant="gold" loading={insightMutation.isPending} onClick={() => insightMutation.mutate()}>
          <Sparkles className="w-4 h-4" />
          {t('ai_insights')}
        </Button>
      </div>

      <ExplorerCharts players={players} />

      {insight && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <GlassCard className="border border-fut-gold/20 text-sm sm:text-base text-white/80 whitespace-pre-wrap">{insight}</GlassCard>
        </motion.div>
      )}

      <GlassCard className="h-[min(420px,52vh)] sm:h-[min(460px,55vh)] lg:h-[min(500px,58vh)] p-2 gradient-border overflow-hidden">
        <div className="w-full h-full min-h-0">
          <ScatterMap players={players} onSelect={setSelected} selectedKey={selected?.player_key} />
        </div>
      </GlassCard>

      <PlayerCardModal player={selected} allPlayers={players} onClose={() => setSelected(null)} />
    </div>
  )
}
