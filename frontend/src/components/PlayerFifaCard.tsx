import { motion } from 'framer-motion'
import type { Player } from '../types'
import { computeFifaCard, TIER_STYLES, type FifaAttr } from '../lib/fifa'
import { Silhouette } from './Silhouette'

const ATTR_ORDER: FifaAttr[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']

interface PlayerFifaCardProps {
  player: Player
  allPlayers: Player[]
  size?: 'full' | 'mini'
  index?: number
  onClick?: () => void
}

const SIZE_CLASS = {
  mini: 'w-[8.75rem] sm:w-[9.5rem] md:w-[10rem] lg:w-[11rem]',
  full: 'w-[12.5rem] sm:w-[14rem] md:w-[15rem] lg:w-[16rem]',
} as const

export function PlayerFifaCard({ player, allPlayers, size = 'full', index = 0, onClick }: PlayerFifaCardProps) {
  const card = computeFifaCard(player, allPlayers)
  const style = TIER_STYLES[card.tier]
  const isMini = size === 'mini'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateY: -8 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={onClick ? { y: -8, scale: 1.03, rotateY: 4 } : { y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl aspect-[2/3] ${SIZE_CLASS[size]} ${style.glow} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: style.gradient,
        border: `2px solid ${style.border}`,
        clipPath: 'polygon(8% 0, 92% 0, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0 92%, 0 8%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 animate-shimmer opacity-30" />
      </div>

      <div className={`relative h-full flex flex-col ${isMini ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'}`} style={{ color: style.text }}>
        <div className="flex justify-between items-start">
          <div>
            <div className={`font-display font-extrabold leading-none ${isMini ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>
              {card.overall}
            </div>
            <div className={`font-stats font-bold uppercase ${isMini ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{card.positionShort}</div>
          </div>
          <div className={`text-right opacity-80 ${isMini ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} font-stats font-semibold uppercase`}>
            <div>{player.team.slice(0, 12)}</div>
            <div>{player.season}</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-1 min-h-0">
          <Silhouette variant={isMini ? 'mini' : 'default'} />
        </div>

        <div className={`font-display font-bold uppercase truncate text-center mb-1 ${isMini ? 'text-xs sm:text-sm' : 'text-sm sm:text-base lg:text-lg'}`}>
          {player.player}
        </div>

        <div className={`grid grid-cols-3 gap-x-1 gap-y-0.5 ${isMini ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-stats font-bold`}>
          {ATTR_ORDER.map(attr => (
            <div key={attr} className="flex justify-between gap-1">
              <span className="opacity-70">{attr}</span>
              <span>{card.attrs[attr]}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
