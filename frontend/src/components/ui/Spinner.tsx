import { motion } from 'framer-motion'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`w-8 h-8 rounded-full border-2 border-fut-gold/30 border-t-fut-gold ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}
