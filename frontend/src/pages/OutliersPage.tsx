import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useFilters } from '../hooks/useFilters'

const METRICS = ['prospect_score', 'rarity_score', 'impact_score', 'xg_per90', 'xa_per90']

function formatMetric(p: import('../types').Player, metric: string): string {
  const record = p as unknown as Record<string, unknown>
  const val = record[metric] ?? p.metrics?.[metric]
  return typeof val === 'number' ? val.toFixed(3) : '-'
}

export function OutliersPage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const [metric, setMetric] = useState('prospect_score')

  const { data, isLoading } = useQuery({
    queryKey: ['outliers', filters, metric],
    queryFn: () => api.getOutliers(filters, metric, 25),
  })

  if (isLoading) return <p className="text-text-secondary">{t('loading')}</p>

  const items = data ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('outliers')}</h2>
        <select className="select w-48" value={metric} onChange={e => setMetric(e.target.value)}>
          {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {!items.length ? (
        <p className="text-text-secondary">{t('no_players')}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-b border-border">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">Jogador</th>
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-left py-2 px-3">Pos</th>
                <th className="text-right py-2 px-3">{metric}</th>
                <th className="text-right py-2 px-3">Prospect</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.player_key} className="border-b border-border-subtle hover:bg-bg-elevated">
                  <td className="py-2 px-3 text-text-muted">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{p.player}</td>
                  <td className="py-2 px-3">{p.team}</td>
                  <td className="py-2 px-3">{p.position_group}</td>
                  <td className="py-2 px-3 text-right">{formatMetric(p, metric)}</td>
                  <td className="py-2 px-3 text-right text-accent">{p.prospect_score?.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
