import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'

interface ChartInfoHelpProps {
  hint: string
  title: string
  detail: string
}

export function ChartInfoHelp({ hint, title, detail }: ChartInfoHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setOpen(true)
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 border border-white/20 text-fut-gold hover:bg-fut-gold/20 hover:border-fut-gold/40 transition-colors"
          aria-label={title}
        >
          <span className="text-[11px] font-bold font-stats leading-none">i</span>
        </button>
        <div className="pointer-events-none absolute right-0 top-full mt-2 w-56 px-3 py-2 rounded-lg glass border border-fut-gold/25 text-xs text-white/85 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30">
          {hint}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              className="relative w-full max-w-md glass-strong rounded-xl p-6 border border-fut-gold/25"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-display text-lg font-bold text-fut-gold pr-8">{title}</h3>
              <p className="mt-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{detail}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
