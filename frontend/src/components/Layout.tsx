import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { UserMenu } from './user/UserMenu'

export function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  const isChat = location.pathname === '/chat'

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
    <div className="fut-bg h-[100dvh] overflow-hidden flex flex-col">
      <header className="shrink-0 z-30 glass-strong border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3 lg:py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <Link to="/" className="flex items-center gap-3 lg:gap-4 group">
              <motion.div
                className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-fut-gold to-fut-emerald flex items-center justify-center font-display font-extrabold text-fut-bg text-lg lg:text-xl shadow-glow-gold"
                animate={{ boxShadow: ['0 0 20px rgba(244,207,107,0.3)', '0 0 32px rgba(16,217,121,0.25)', '0 0 20px rgba(244,207,107,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                SR
              </motion.div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide text-fut-gold group-hover:text-white transition-colors">
                {t('app_title')}
              </h1>
            </Link>
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

          <UserMenu />
        </div>
      </header>

      <main className={`flex-1 min-h-0 w-full flex flex-col overflow-hidden ${isChat ? 'px-4 sm:px-6 lg:px-8 xl:px-10 py-3' : 'px-4 sm:px-6 lg:px-8 xl:px-10 py-4 lg:py-6 overflow-y-auto'}`}>
        {!datasetStatus?.active && !isChat && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 lg:mb-6 shrink-0 glass rounded-xl p-4 border border-fut-gold/30 text-sm text-fut-gold/90"
          >
            {t('no_data')} — <code className="text-xs bg-black/30 px-1 rounded">docker compose exec backend python -m app.pipeline --sample</code>
          </motion.div>
        )}

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex-1 min-h-0 flex flex-col ${isChat ? 'overflow-hidden' : ''}`}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
