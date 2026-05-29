import { useTranslation } from 'react-i18next'
import type { Player } from '../types'

interface PlayerCardProps {
  player: Player | null
  onClose: () => void
  onInsight?: () => void
  insight?: string
  loadingInsight?: boolean
}

export function PlayerCard({ player, onClose, onInsight, insight, loadingInsight }: PlayerCardProps) {
  const { t } = useTranslation()
  if (!player) return null

  const metrics = player.metrics || {}

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{player.player}</h2>
            <p className="text-text-secondary">{player.team} · {player.season} · {player.position_group}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl">&times;</button>
        </div>

        {player.image_url && (
          <img src={player.image_url} alt={player.player} className="w-24 h-24 rounded-full object-cover mb-4 mx-auto" />
        )}

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div><span className="text-text-muted">Idade</span> {player.age}</div>
          <div><span className="text-text-muted">Minutos</span> {player.minutes}</div>
          {player.prospect_score != null && <div><span className="text-text-muted">Prospect</span> {player.prospect_score.toFixed(3)}</div>}
          {player.cluster_id != null && <div><span className="text-text-muted">Cluster</span> {player.cluster_id}</div>}
        </div>

        {Object.keys(metrics).length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Métricas</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(metrics).slice(0, 12).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-bg-elevated px-2 py-1 rounded">
                  <span className="text-text-muted">{k}</span>
                  <span>{typeof v === 'number' ? v.toFixed(3) : v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onInsight && (
          <button className="btn-primary w-full mb-2" onClick={onInsight} disabled={loadingInsight}>
            {loadingInsight ? t('loading') : t('ai_insights')}
          </button>
        )}

        {insight && (
          <div className="bg-bg-elevated p-3 rounded text-sm whitespace-pre-wrap">{insight}</div>
        )}
      </div>
    </div>
  )
}
