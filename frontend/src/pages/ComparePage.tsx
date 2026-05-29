import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useFilters } from '../hooks/useFilters'

export function ComparePage() {
  const { t } = useTranslation()
  const { filters } = useFilters()
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')

  const { data: playersData } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => api.getPlayers(filters),
  })

  const compareMutation = useMutation({
    mutationFn: () => api.compare([playerA, playerB]),
  })

  const players = playersData?.items ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('compare')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-text-secondary">{t('player_a')}</label>
          <select className="select mt-1" value={playerA} onChange={e => setPlayerA(e.target.value)}>
            <option value="">{t('select_player')}</option>
            {players.map(p => <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-text-secondary">{t('player_b')}</label>
          <select className="select mt-1" value={playerB} onChange={e => setPlayerB(e.target.value)}>
            <option value="">{t('select_player')}</option>
            {players.map(p => <option key={p.player_key} value={p.player_key}>{p.player} ({p.team})</option>)}
          </select>
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!playerA || !playerB || playerA === playerB || compareMutation.isPending}
        onClick={() => compareMutation.mutate()}
      >
        {compareMutation.isPending ? t('loading') : t('compare')}
      </button>

      {playerA === playerB && playerA && (
        <p className="text-red-400 text-sm">{t('select_two')}</p>
      )}

      {compareMutation.data && (
        <div className="card">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-bold">{compareMutation.data.player_a?.player}</h3>
              <p className="text-text-secondary text-sm">{compareMutation.data.player_a?.team}</p>
            </div>
            <div>
              <h3 className="font-bold">{compareMutation.data.player_b?.player}</h3>
              <p className="text-text-secondary text-sm">{compareMutation.data.player_b?.team}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-b border-border">
                <th className="text-left py-2">{t('metric')}</th>
                <th className="text-right py-2">A</th>
                <th className="text-right py-2">B</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(compareMutation.data.metrics).map(([key, vals]) => (
                <tr key={key} className="border-b border-border-subtle">
                  <td className="py-2">{key}</td>
                  <td className="py-2 text-right">{vals.a != null ? Number(vals.a).toFixed(3) : '-'}</td>
                  <td className="py-2 text-right">{vals.b != null ? Number(vals.b).toFixed(3) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
