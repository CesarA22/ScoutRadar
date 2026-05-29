import { motion } from 'framer-motion'

interface ChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  color?: string
}

export function Chip({ label, active, onClick, color }: ChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={active && color ? { backgroundColor: color, boxShadow: `0 0 12px ${color}66` } : undefined}
      className={`px-3 py-1.5 rounded-full text-xs font-stats font-semibold uppercase tracking-wide transition-all ${
        active
          ? color
            ? 'text-white'
            : 'bg-gradient-to-r from-fut-gold to-fut-gold-dark text-fut-bg shadow-glow-gold'
          : 'glass text-white/60 hover:text-white hover:border-fut-gold/30 border border-transparent'
      }`}
    >
      {label}
    </motion.button>
  )
}
