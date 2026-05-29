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
  const isChat = location.pathname === '/chat'

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
    <div className="fut-bg min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3 lg:py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <motion.div
              className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-fut-gold to-fut-emerald flex items-center justify-center font-display font-extrabold text-fut-bg text-lg lg:text-xl shadow-glow-gold"
              animate={{ boxShadow: ['0 0 20px rgba(244,207,107,0.3)', '0 0 32px rgba(16,217,121,0.25)', '0 0 20px rgba(244,207,107,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              SR
            </motion.div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide text-fut-gold">{t('app_title')}</h1>
              {datasetStatus?.active && (
                <p className="text-xs sm:text-sm text-white/40 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  {datasetStatus.row_count} {t('players_shown')}
                </p>
              )}
            </div>
          </div>

          <nav className="flex gap-1 glass rounded-xl p-1 relative order-last w-full sm:order-none sm:w-auto">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="relative flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium z-10 text-center"
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

          <div className="flex items-center gap-2 lg:gap-3">
            {datasetStatus?.active ? (
              <Badge variant="emerald" className="text-xs sm:text-sm px-3 py-1">{t('dataset_status')}</Badge>
            ) : (
              <Badge variant="muted" className="text-xs sm:text-sm px-3 py-1">{t('no_data')}</Badge>
            )}
            <FiltersDrawerTrigger onClick={() => setFiltersOpen(true)} />
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 lg:py-6 flex flex-col min-h-0 ${isChat ? 'pb-3' : ''}`}>
        {!datasetStatus?.active && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 lg:mb-6 glass rounded-xl p-4 lg:p-5 border border-fut-gold/30 text-sm lg:text-base text-fut-gold/90"
          >
            {t('no_data')} — <code className="text-xs lg:text-sm bg-black/30 px-1.5 py-0.5 rounded">docker compose exec backend python -m app.pipeline --sample</code>
          </motion.div>
        )}

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-0"
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
