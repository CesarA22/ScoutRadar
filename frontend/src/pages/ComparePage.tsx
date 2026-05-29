import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { PlayerFifaCard } from '../components/PlayerFifaCard'
import { Button, GlassCard, Select, Spinner } from '../components/ui'
import { RadarChart } from '../components/ui/RadarChart'
import { computeFifaCard } from '../lib/fifa'
import { useFilters } from '../hooks/useFilters'

export function ComparePage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')

  const { data: playersData, isLoading } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => api.getPlayers(filters),
  })

  const compareMutation = useMutation({
    mutationFn: () => api.compare([playerA, playerB]),
  })

  const players = playersData?.items ?? []
  const pa = players.find(p => p.player_key === playerA)
  const pb = players.find(p => p.player_key === playerB)
  const cardA = pa ? computeFifaCard(pa, players) : null
  const cardB = pb ? computeFifaCard(pb, players) : null

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold flex items-center gap-2">
          <Swords className="w-8 h-8 text-fut-emerald" />
          {t('compare')}
        </h2>
        <p className="text-white/40 text-sm mt-1">{t('select_two')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Select label={t('player_a')} value={playerA} onChange={e => setPlayerA(e.target.value)}>
          <option value="">{t('select_player')}</option>
          {players.map(p => (
            <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>
          ))}
        </Select>
        <Select label={t('player_b')} value={playerB} onChange={e => setPlayerB(e.target.value)}>
          <option value="">{t('select_player')}</option>
          {players.map(p => (
            <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>
          ))}
        </Select>
      </div>

      <Button
        variant="gold"
        disabled={!playerA || !playerB || playerA === playerB}
        loading={compareMutation.isPending}
        onClick={() => compareMutation.mutate()}
      >
        {t('compare')}
      </Button>

      {pa && pb && cardA && cardB && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-wrap justify-center gap-8">
            <PlayerFifaCard player={pa} allPlayers={players} />
            <div className="hidden md:flex items-center font-display text-4xl text-fut-gold/50">VS</div>
            <PlayerFifaCard player={pb} allPlayers={players} />
          </div>

          <GlassCard className="flex flex-col items-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Radar comparativo</p>
            <RadarChart attrs={cardA.attrs} compare={cardB.attrs} size={280} />
            <div className="flex gap-6 mt-4 text-xs">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-fut-emerald/80" /> {pa.player}</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400/80" /> {pb.player}</span>
            </div>
          </GlassCard>

          <GlassCard>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="py-2 text-left">{t('metric')}</th>
                  <th className="py-2 text-right">{pa.player}</th>
                  <th className="py-2 text-right">{pb.player}</th>
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
                      <td className="py-2 font-stats font-bold text-fut-gold">{attr}</td>
                      <td className={`py-2 text-right font-stats ${winA ? 'text-fut-emerald font-bold' : ''}`}>{a}</td>
                      <td className={`py-2 text-right font-stats ${winB ? 'text-fut-emerald font-bold' : ''}`}>{b}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
