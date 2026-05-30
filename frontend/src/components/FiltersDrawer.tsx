import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CLUSTER_COLORS } from '../lib/fifa'
import { useFilters } from '../hooks/useFilters'
import { Chip, Select, Slider } from './ui'
import { MultiSelect } from './ui/MultiSelect'
import { Button } from './ui/Button'

const POSITIONS = ['GK', 'CB', 'FB', 'DM', 'CM_AM', 'W', 'ST']

interface FiltersDrawerProps {
  open: boolean
  onClose: () => void
  availableTeams: string[]
  availableClusters: number[]
  availableSeasons: number[]
}

export function FiltersDrawer({ open, onClose, availableTeams, availableClusters, availableSeasons }: FiltersDrawerProps) {
  const { t } = useTranslation()
  const { filters, updateFilter, resetFilters } = useFilters()

  const toggle = <T,>(arr: T[], val: T) => (arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm lg:max-w-md glass-strong shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 glass-strong border-b border-white/10 p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-fut-gold" />
                <span className="font-display font-bold text-lg">{t('filters')}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="p-2 rounded-lg hover:bg-white/10 text-fut-gold"
                  title={t('clear_filters')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <Button variant="secondary" className="w-full" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4" />
                {t('clear_filters')}
              </Button>

              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{t('season')}</p>
                <div className="flex flex-wrap gap-2">
                  {availableSeasons.map(s => (
                    <Chip key={s} label={String(s)} active={filters.seasons.includes(s)} onClick={() => updateFilter('seasons', toggle(filters.seasons, s))} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{t('position')}</p>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(p => (
                    <Chip
                      key={p}
                      label={p}
                      active={filters.positionGroups.length === 0 || filters.positionGroups.includes(p)}
                      onClick={() => updateFilter('positionGroups', toggle(filters.positionGroups, p))}
                    />
                  ))}
                </div>
              </div>

              <Slider label={t('age_max')} value={filters.ageMax} min={18} max={23} onChange={v => updateFilter('ageMax', v)} />
              <Slider label={t('minutes_min')} value={filters.minutesMin} min={400} max={2500} step={100} onChange={v => updateFilter('minutesMin', v)} />

              {availableTeams.length > 0 && (
                <MultiSelect
                  label={t('teams')}
                  options={availableTeams}
                  value={filters.teams}
                  onChange={v => updateFilter('teams', v)}
                />
              )}

              {availableClusters.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{t('clusters')}</p>
                  <div className="flex flex-wrap gap-2">
                    {availableClusters.map(c => (
                      <Chip
                        key={c}
                        label={String(c)}
                        active={filters.clusters.includes(c)}
                        color={CLUSTER_COLORS[c % CLUSTER_COLORS.length]}
                        onClick={() => updateFilter('clusters', toggle(filters.clusters, c))}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function FiltersDrawerTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 glass px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl text-sm lg:text-base font-medium hover:border-fut-gold/40 border border-transparent"
    >
      <SlidersHorizontal className="w-4 h-4 text-fut-gold" />
      {t('filters')}
    </motion.button>
  )
}
