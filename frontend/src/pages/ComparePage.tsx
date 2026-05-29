import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, Swords } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { PlayerFifaCard } from '../components/PlayerFifaCard'
import { Button, GlassCard, Select, Spinner } from '../components/ui'
import { InsightLoading } from '../components/ui/InsightLoading'
import { RadarChart } from '../components/ui/RadarChart'
import { useResponsiveSize } from '../hooks/useViewportWidth'
import { computeFifaCard } from '../lib/fifa'
import { useFilters } from '../hooks/useFilters'

export function ComparePage() {
  const { t, i18n } = useTranslation()
  const { filters } = useFilters()
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')
  const [insight, setInsight] = useState('')
  const radarSize = useResponsiveSize(260, 360)

  const { data: playersData, isLoading } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => api.getPlayers(filters),
  })

  const ready = Boolean(playerA && playerB && playerA !== playerB)

  const insightMutation = useMutation({
    mutationFn: () => api.compareInsight([playerA, playerB], i18n.language),
    onSuccess: res => setInsight(res.text),
  })

  const players = playersData?.items ?? []
  const pa = players.find(p => p.player_key === playerA)
  const pb = players.find(p => p.player_key === playerB)
  const cardA = pa ? computeFifaCard(pa, players) : null
  const cardB = pb ? computeFifaCard(pb, players) : null

  const onSelectChange = (side: 'a' | 'b', value: string) => {
    setInsight('')
    if (side === 'a') setPlayerA(value)
    else setPlayerB(value)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center fill-main gap-4">
        <Spinner className="w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div>
        <h2 className="page-title flex items-center gap-3">
          <Swords className="w-9 h-9 lg:w-11 lg:h-11 text-fut-emerald shrink-0" />
          {t('compare')}
        </h2>
        <p className="page-subtitle">{t('select_two')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl xl:max-w-none">
        <Select label={t('player_a')} value={playerA} onChange={e => onSelectChange('a', e.target.value)}>
          <option value="">{t('select_player')}</option>
          {players.map(p => (
            <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>
          ))}
        </Select>
        <Select label={t('player_b')} value={playerB} onChange={e => onSelectChange('b', e.target.value)}>
          <option value="">{t('select_player')}</option>
          {players.map(p => (
            <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>
          ))}
        </Select>
      </div>

      {ready && pa && pb && cardA && cardB && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 lg:space-y-8">
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 xl:gap-24 py-4">
            <PlayerFifaCard player={pa} allPlayers={players} />
            <div className="font-display text-5xl lg:text-6xl xl:text-7xl text-fut-gold/50">VS</div>
            <PlayerFifaCard player={pb} allPlayers={players} />
          </div>

          <GlassCard className="flex flex-col items-center py-6 lg:py-8">
            <p className="text-sm lg:text-base text-white/40 uppercase tracking-wider mb-6">Radar comparativo</p>
            <RadarChart attrs={cardA.attrs} compare={cardB.attrs} size={radarSize} />
            <div className="flex flex-wrap justify-center gap-6 lg:gap-10 mt-6 text-sm lg:text-base">
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-fut-emerald/80" /> {pa.player}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-blue-400/80" /> {pb.player}</span>
            </div>
          </GlassCard>

          <GlassCard>
            <table className="w-full text-base lg:text-lg">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="py-3 text-left">{t('metric')}</th>
                  <th className="py-3 text-right">{pa.player}</th>
                  <th className="py-3 text-right">{pb.player}</th>
                </tr>
              </thead>
              <tbody>
                {(['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'] as const).map(attr => {
                  const a = cardA.attrs[attr]
                  const b = cardB.attrs[attr]
                  const winA = a > b
                  const winB = b > a
                  return (
                    <tr key={attr} className="border-b border-white/5">
                      <td className="py-3 font-stats font-bold text-fut-gold">{attr}</td>
                      <td className={`py-3 text-right font-stats text-lg ${winA ? 'text-fut-emerald font-bold' : ''}`}>{a}</td>
                      <td className={`py-3 text-right font-stats text-lg ${winB ? 'text-fut-emerald font-bold' : ''}`}>{b}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </GlassCard>

          <div className="flex justify-center">
            <Button
              variant="gold"
              className="text-base lg:text-lg px-8 py-3.5"
              loading={insightMutation.isPending}
              onClick={() => insightMutation.mutate()}
            >
              <Sparkles className="w-5 h-5" />
              {t('ai_compare_insights')}
            </Button>
          </div>

          {insightMutation.isPending && (
            <GlassCard>
              <InsightLoading />
            </GlassCard>
          )}

          {insight && !insightMutation.isPending && (
            <GlassCard className="border border-fut-gold/20 text-base lg:text-lg text-white/85 whitespace-pre-wrap leading-relaxed">
              {insight}
            </GlassCard>
          )}
        </motion.div>
      )}
    </div>
  )
}
