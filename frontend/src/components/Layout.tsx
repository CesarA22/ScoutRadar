import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { FiltersDrawer, FiltersDrawerTrigger } from './FiltersDrawer'
import { Badge } from './ui'

export function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: filterOpts } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.getFilters(),
  })

  const { data: datasetStatus } = useQuery({
    queryKey: ['dataset-status'],
    queryFn: () => api.getDatasetStatus(),
  })

  const tabs = [
    { to: '/explorer', label: t('explorer') },
    { to: '/outliers', label: t('outliers') },
    { to: '/compare', label: t('compare') },
    { to: '/chat', label: t('chat') },
  ]

  return (
    <div className="fut-bg min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-fut-gold to-fut-emerald flex items-center justify-center font-display font-extrabold text-fut-bg text-lg shadow-glow-gold"
              animate={{ boxShadow: ['0 0 20px rgba(244,207,107,0.3)', '0 0 32px rgba(16,217,121,0.25)', '0 0 20px rgba(244,207,107,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              SR
            </motion.div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wide text-fut-gold">{t('app_title')}</h1>
              {datasetStatus?.active && (
                <p className="text-[10px] text-white/40 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {datasetStatus.row_count} {t('players_shown')}
                </p>
              )}
            </div>
          </div>

          <nav className="flex gap-1 glass rounded-xl p-1 relative">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="relative px-4 py-2 rounded-lg text-sm font-medium z-10"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-gradient-to-r from-fut-gold/90 to-fut-gold-dark/90 rounded-lg shadow-glow-gold"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${isActive ? 'text-fut-bg font-bold' : 'text-white/60 hover:text-white'}`}>
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {datasetStatus?.active ? (
              <Badge variant="emerald">{t('dataset_status')}</Badge>
            ) : (
              <Badge variant="muted">{t('no_data')}</Badge>
            )}
            <FiltersDrawerTrigger onClick={() => setFiltersOpen(true)} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {!datasetStatus?.active && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass rounded-xl p-4 border border-fut-gold/30 text-sm text-fut-gold/90"
          >
            {t('no_data')} — <code className="text-xs bg-black/30 px-1 rounded">docker compose exec backend python -m app.pipeline --sample</code>
          </motion.div>
        )}

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        availableTeams={filterOpts?.teams ?? []}
        availableClusters={filterOpts?.clusters ?? []}
        availableSeasons={filterOpts?.seasons ?? [2023, 2024]}
      />
    </div>
  )
}
