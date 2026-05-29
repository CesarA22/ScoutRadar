interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'emerald' | 'muted'
}

export function Badge({ children, variant = 'muted' }: BadgeProps) {
  const styles = {
    gold: 'bg-fut-gold/20 text-fut-gold border-fut-gold/30',
    emerald: 'bg-fut-emerald/20 text-fut-emerald border-fut-emerald/30',
    muted: 'bg-white/5 text-white/60 border-white/10',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-stats font-bold uppercase tracking-wider border ${styles[variant]}`}>
      {children}
    </span>
  )
}
