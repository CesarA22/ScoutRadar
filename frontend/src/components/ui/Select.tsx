import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs sm:text-sm text-white/50 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          className={`fut-select w-full appearance-none glass rounded-xl px-4 py-3 lg:py-3.5 pr-10 text-sm lg:text-base text-white cursor-pointer hover:border-fut-gold/30 focus:outline-none focus:ring-1 focus:ring-fut-gold/50 transition-colors ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  )
}
