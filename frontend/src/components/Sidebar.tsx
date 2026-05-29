import { useTranslation } from 'react-i18next'
import { useFilters } from '../hooks/useFilters'

const POSITIONS = ['GK', 'CB', 'FB', 'DM', 'CM_AM', 'W', 'ST']
const CLUSTER_COLORS = ['#7c5cff', '#5b8def', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#a855f7']

interface SidebarProps {
  availableTeams: string[]
  availableClusters: number[]
  availableSeasons: number[]
}

export function Sidebar({ availableTeams, availableClusters, availableSeasons }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const { filters, updateFilter } = useFilters()

  const toggleArray = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  return (
    <aside className="w-64 shrink-0 bg-bg-secondary border-r border-border p-4 space-y-4 overflow-y-auto max-h-screen sticky top-0">
      <h1 className="text-xl font-bold text-accent">{t('app_title')}</h1>

      <div>
        <label className="text-sm text-text-secondary block mb-1">{t('language')}</label>
        <select className="select" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
          <option value="pt">Português</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-text-secondary block mb-1">{t('season')}</label>
        <div className="flex flex-wrap gap-1">
          {availableSeasons.map(s => (
            <button
              key={s}
              className={`px-2 py-1 text-xs rounded ${filters.seasons.includes(s) ? 'bg-accent text-white' : 'bg-bg-elevated text-text-secondary'}`}
              onClick={() => updateFilter('seasons', toggleArray(filters.seasons, s))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-text-secondary block mb-1">{t('position')}</label>
        <div className="flex flex-wrap gap-1">
          {POSITIONS.map(p => (
            <button
              key={p}
              className={`px-2 py-1 text-xs rounded ${filters.positionGroups.length === 0 || filters.positionGroups.includes(p) ? 'bg-accent/80 text-white' : 'bg-bg-elevated text-text-secondary'}`}
              onClick={() => updateFilter('positionGroups', toggleArray(filters.positionGroups, p))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-text-secondary block mb-1">{t('age_max')}: {filters.ageMax}</label>
        <input type="range" min={18} max={23} value={filters.ageMax} onChange={e => updateFilter('ageMax', +e.target.value)} className="w-full" />
      </div>

      <div>
        <label className="text-sm text-text-secondary block mb-1">{t('minutes_min')}: {filters.minutesMin}</label>
        <input type="range" min={400} max={2500} step={100} value={filters.minutesMin} onChange={e => updateFilter('minutesMin', +e.target.value)} className="w-full" />
      </div>

      {availableTeams.length > 0 && (
        <div>
          <label className="text-sm text-text-secondary block mb-1">{t('teams')}</label>
          <select
            multiple
            className="select h-24"
            value={filters.teams}
            onChange={e => updateFilter('teams', Array.from(e.target.selectedOptions, o => o.value))}
          >
            {availableTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      )}

      {availableClusters.length > 0 && (
        <div>
          <label className="text-sm text-text-secondary block mb-1">{t('clusters')}</label>
          <div className="flex flex-wrap gap-1">
            {availableClusters.map(c => (
              <button
                key={c}
                style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }}
                className={`px-2 py-1 text-xs rounded text-white ${filters.clusters.includes(c) ? 'ring-2 ring-white' : 'opacity-60'}`}
                onClick={() => updateFilter('clusters', toggleArray(filters.clusters, c))}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export { CLUSTER_COLORS }
