import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className = '', hover, onClick }: GlassCardProps) {
  const base = `glass rounded-xl p-4 shadow-card ${onClick ? 'cursor-pointer' : ''} ${className}`

  if (onClick || hover) {
    return (
      <motion.div
        className={base}
        whileHover={hover ? { y: -2 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}
