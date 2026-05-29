import { Check } from 'lucide-react'

interface MultiSelectProps {
  label?: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiSelect({ label, options, value, onChange }: MultiSelectProps) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>}
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl glass border border-white/5">
        {options.map(opt => {
          const active = value.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                active
                  ? 'bg-fut-gold/20 border-fut-gold/50 text-fut-gold'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              {active && <Check className="w-3 h-3" />}
              {opt}
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="text-xs text-fut-gold/80 hover:text-fut-gold">
          ×
        </button>
      )}
    </div>
  )
}
