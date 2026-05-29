import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { Sidebar } from '../components/Sidebar'

export function Layout() {
  const { t } = useTranslation()

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
    <div className="flex min-h-screen">
      <Sidebar
        availableTeams={filterOpts?.teams ?? []}
        availableClusters={filterOpts?.clusters ?? []}
        availableSeasons={filterOpts?.seasons ?? [2023, 2024]}
      />
      <main className="flex-1 p-6 overflow-x-hidden">
        <nav className="flex gap-2 mb-6 bg-bg-secondary p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {datasetStatus && (
          <div className="text-xs text-text-muted mb-4">
            {t('dataset_status')}: {datasetStatus.active ? `${datasetStatus.row_count} jogadores (${datasetStatus.source})` : t('no_data')}
          </div>
        )}

        {!datasetStatus?.active && (
          <div className="card mb-4 border-yellow-600/50 text-yellow-200 text-sm">
            {t('no_data')} — rode: <code className="bg-bg-primary px-1 rounded">docker compose exec backend python -m app.pipeline --sample</code>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  )
}
