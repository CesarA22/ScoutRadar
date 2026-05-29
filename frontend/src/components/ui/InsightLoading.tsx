import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Spinner } from './Spinner'

export function InsightLoading() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 text-sm text-white/55">
      <Spinner className="w-5 h-5 shrink-0" />
      <span>{t('insight_loading')}</span>
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-fut-gold"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </span>
    </div>
  )
}
