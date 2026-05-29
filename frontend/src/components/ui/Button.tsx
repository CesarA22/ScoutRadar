import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold'

interface ButtonProps {
  variant?: Variant
  loading?: boolean
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-fut-emerald to-fut-emerald-dim text-fut-bg font-semibold shadow-glow-emerald hover:brightness-110',
  gold: 'bg-gradient-to-r from-fut-gold to-fut-gold-dark text-fut-bg font-bold shadow-glow-gold hover:brightness-110',
  secondary: 'glass text-white border border-white/10 hover:border-fut-gold/40',
  ghost: 'text-white/70 hover:text-fut-gold hover:bg-white/5',
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, onClick, type = 'button' }: ButtonProps) {
  return (
    <motion.div whileTap={{ scale: disabled || loading ? 1 : 0.97 }} className="inline-block">
      <button
        type={type}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 lg:px-6 lg:py-3.5 rounded-xl text-sm lg:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        disabled={disabled || loading}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    </motion.div>
  )
}
