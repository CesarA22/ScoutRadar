import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useResponsiveSize } from '../hooks/useViewportWidth'
import { computeFifaCard } from '../lib/fifa'
import type { Player } from '../types'
import { PlayerAskChat } from './PlayerAskChat'
import { PlayerFifaCard } from './PlayerFifaCard'
import { Badge, CountUp, GlassCard, InsightLoading } from './ui'
import { RadarChart } from './ui/RadarChart'

interface PlayerCardModalProps {
  player: Player | null
  allPlayers: Player[]
  onClose: () => void
}

export function PlayerCardModal({ player, allPlayers, onClose }: PlayerCardModalProps) {
  const { t, i18n } = useTranslation()
  const radarSize = useResponsiveSize(200, 280)

  const {
    data: insightData,
    isPending: insightLoading,
    isError: insightError,
  } = useQuery({
    queryKey: ['player-insight', player?.player_key, i18n.language],
    queryFn: () => api.playerInsight(player!.player_key, i18n.language),
    enabled: !!player,
    staleTime: 0,
  })

  useEffect(() => {
    if (!player) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [player, onClose])

  const card = player ? computeFifaCard(player, allPlayers) : null

  return (
    <AnimatePresence>
      {player && card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 lg:p-10"
          onClick={onClose}
        >
          <div className="min-h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-6xl xl:max-w-7xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute -top-1 right-0 sm:top-0 sm:right-0 z-20 p-2.5 rounded-full glass hover:bg-white/10 text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 items-start pt-8 sm:pt-0">
                <div className="flex justify-center lg:justify-start">
                  <PlayerFifaCard player={player} allPlayers={allPlayers} />
                </div>

                <GlassCard className="space-y-5 lg:space-y-6 min-w-0 p-5 lg:p-8">
                  <div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-fut-gold truncate">{player.player}</h2>
                    <p className="text-white/50 text-base lg:text-lg mt-2">
                      {player.team} · {player.season} · U-{player.age}
                    </p>
                  </div>

                  <div className="flex justify-center py-2">
                    <RadarChart attrs={card.attrs} size={radarSize} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 lg:gap-4">
                    {player.prospect_score != null && (
                      <div className="glass rounded-xl p-3 lg:p-4 text-center">
                        <div className="text-xs lg:text-sm uppercase text-white/40">Prospect</div>
                        <div className="font-stats text-xl lg:text-2xl font-bold text-fut-emerald">
                          <CountUp value={player.prospect_score} decimals={2} />
                        </div>
                      </div>
                    )}
                    {player.rarity_score != null && (
                      <div className="glass rounded-xl p-3 lg:p-4 text-center">
                        <div className="text-xs lg:text-sm uppercase text-white/40">Rarity</div>
                        <div className="font-stats text-xl lg:text-2xl font-bold text-fut-gold">
                          <CountUp value={player.rarity_score} decimals={2} />
                        </div>
                      </div>
                    )}
                    {player.impact_score != null && (
                      <div className="glass rounded-xl p-3 lg:p-4 text-center">
                        <div className="text-xs lg:text-sm uppercase text-white/40">Impact</div>
                        <div className="font-stats text-xl lg:text-2xl font-bold text-white">
                          <CountUp value={player.impact_score} decimals={2} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="emerald">Cluster {player.cluster_id ?? '—'}</Badge>
                    <Badge>{player.minutes} min</Badge>
                  </div>

                  <div className="glass rounded-xl p-5 lg:p-6 border border-fut-gold/15 min-h-[100px]">
                    {insightLoading && <InsightLoading />}
                    {insightData?.text && !insightLoading && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-base lg:text-lg text-white/85 whitespace-pre-wrap leading-relaxed"
                      >
                        {insightData.text}
                      </motion.p>
                    )}
                    {insightError && (
                      <p className="text-base text-white/40">{t('insight_error')}</p>
                    )}
                  </div>

                  <PlayerAskChat player={player} />
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
