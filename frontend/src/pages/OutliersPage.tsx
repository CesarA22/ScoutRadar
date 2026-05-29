import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { PlayerCardModal } from '../components/PlayerCardModal'
import { PlayerFifaCard } from '../components/PlayerFifaCard'
import { GlassCard, Select, Spinner } from '../components/ui'
import { useFilters } from '../hooks/useFilters'
import type { Player } from '../types'

const METRICS = ['prospect_score', 'rarity_score', 'impact_score', 'xg_per90', 'xa_per90']

export function OutliersPage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const [metric, setMetric] = useState('prospect_score')
  const [selected, setSelected] = useState<Player | null>(null)

  const { data: allPlayers } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => api.getPlayers(filters),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['outliers', filters, metric],
    queryFn: () => api.getOutliers(filters, metric, 25),
  })

  const pool = allPlayers?.items ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center fill-main gap-4">
        <Spinner className="w-10 h-10" />
        <p className="text-white/40 text-base">{t('loading')}</p>
      </div>
    )
  }

  const items = data ?? []

  return (
    <div className="page-shell">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="page-title flex items-center gap-3">
            <TrendingUp className="w-9 h-9 lg:w-11 lg:h-11 text-fut-gold shrink-0" />
            {t('outliers')}
          </h2>
          <p className="page-subtitle">Top prospects — clique na carta para detalhes</p>
        </div>
        <Select label={t('metric')} value={metric} onChange={e => setMetric(e.target.value)} className="w-full sm:w-56 lg:w-64">
          {METRICS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
      </div>

      {!items.length ? (
        <GlassCard className="text-center py-20 text-white/50 text-lg">{t('no_players')}</GlassCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 lg:gap-6 justify-items-center">
          {items.map((p, i) => (
            <PlayerFifaCard
              key={p.player_key}
              player={p}
              allPlayers={pool}
              size="mini"
              index={i}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm lg:text-base">
          <thead>
            <tr className="text-white/40 border-b border-white/10 text-left">
              <th className="py-3 px-3 lg:px-4">#</th>
              <th className="py-3 px-3 lg:px-4">Jogador</th>
              <th className="py-3 px-3 lg:px-4">Time</th>
              <th className="py-3 px-3 lg:px-4">Pos</th>
              <th className="py-3 px-3 lg:px-4 text-right">{metric}</th>
              <th className="py-3 px-3 lg:px-4 text-right">Prospect</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => (
              <motion.tr
                key={p.player_key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => setSelected(p)}
              >
                <td className="py-2.5 px-3 lg:px-4 text-white/30 font-stats">{i + 1}</td>
                <td className="py-2.5 px-3 lg:px-4 font-medium">{p.player}</td>
                <td className="py-2.5 px-3 lg:px-4 text-white/60">{p.team}</td>
                <td className="py-2.5 px-3 lg:px-4">{p.position_group}</td>
                <td className="py-2.5 px-3 lg:px-4 text-right font-stats text-fut-gold">
                  {formatMetric(p, metric)}
                </td>
                <td className="py-2.5 px-3 lg:px-4 text-right font-stats text-fut-emerald">{p.prospect_score?.toFixed(3)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <PlayerCardModal player={selected} allPlayers={pool} onClose={() => setSelected(null)} />
    </div>
  )
}

function formatMetric(p: Player, metric: string): string {
  const record = p as unknown as Record<string, unknown>
  const val = record[metric] ?? p.metrics?.[metric]
  return typeof val === 'number' ? val.toFixed(3) : '—'
}
