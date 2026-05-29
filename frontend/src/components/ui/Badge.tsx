interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'emerald' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  const styles = {
    gold: 'bg-fut-gold/20 text-fut-gold border-fut-gold/30',
    emerald: 'bg-fut-emerald/20 text-fut-emerald border-fut-emerald/30',
    muted: 'bg-white/5 text-white/60 border-white/10',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-stats font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
