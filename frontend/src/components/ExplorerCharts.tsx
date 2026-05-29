import Plot from 'react-plotly.js'
import { useTranslation } from 'react-i18next'
import type { Player } from '../types'
import { ChartInfoHelp, GlassCard } from './ui'

const plotLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { color: 'rgba(255,255,255,0.6)', size: 12, family: 'Inter' },
  margin: { l: 44, r: 12, t: 32, b: 40 },
  showlegend: false,
}

interface ExplorerChartsProps {
  players: Player[]
}

export function ExplorerCharts({ players }: ExplorerChartsProps) {
  const { t } = useTranslation()

  const byPos = POSITION_COUNTS(players)
  const topProspect = [...players]
    .filter(p => p.prospect_score != null)
    .sort((a, b) => (b.prospect_score ?? 0) - (a.prospect_score ?? 0))
    .slice(0, 8)

  const byCluster = CLUSTER_COUNTS(players)

  const charts = [
    {
      key: 'position',
      hint: t('chart_pos_hint'),
      title: t('chart_by_position'),
      detail: t('chart_pos_detail'),
      plot: (
        <Plot
          data={[{
            type: 'bar',
            x: byPos.labels,
            y: byPos.values,
            marker: { color: 'rgba(16, 217, 121, 0.75)' },
          }]}
          layout={{
            ...plotLayout,
            title: { text: t('chart_by_position'), font: { size: 13, color: 'rgba(244,207,107,0.8)' } },
            xaxis: { tickangle: -30, gridcolor: 'rgba(255,255,255,0.05)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      ),
    },
    {
      key: 'prospect',
      hint: t('chart_prospect_hint'),
      title: t('chart_top_prospect'),
      detail: t('chart_prospect_detail'),
      plot: (
        <Plot
          data={[{
            type: 'bar',
            x: topProspect.map(p => p.player.split(' ').pop() ?? p.player),
            y: topProspect.map(p => p.prospect_score ?? 0),
            marker: { color: 'rgba(244, 207, 107, 0.85)' },
          }]}
          layout={{
            ...plotLayout,
            title: { text: t('chart_top_prospect'), font: { size: 13, color: 'rgba(244,207,107,0.8)' } },
            xaxis: { tickangle: -30, gridcolor: 'rgba(255,255,255,0.05)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      ),
    },
    {
      key: 'clusters',
      hint: t('chart_cluster_hint'),
      title: t('chart_clusters'),
      detail: t('chart_cluster_detail'),
      plot: (
        <Plot
          data={[{
            type: 'pie',
            labels: byCluster.labels,
            values: byCluster.values,
            marker: { colors: ['#10d979', '#f4cf6b', '#5b8def', '#ef4444', '#ec4899', '#06b6d4'] },
            hole: 0.45,
            textinfo: 'label+percent',
            textfont: { size: 11, color: '#fff' },
          }]}
          layout={{
            ...plotLayout,
            title: { text: t('chart_clusters'), font: { size: 13, color: 'rgba(244,207,107,0.8)' } },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      ),
    },
  ] as const

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 shrink-0">
      {charts.map(c => (
        <GlassCard key={c.key} className="h-[200px] sm:h-[220px] lg:h-[240px] p-2 relative">
          <div className="absolute top-2 right-2 z-10">
            <ChartInfoHelp hint={c.hint} title={c.title} detail={c.detail} />
          </div>
          {c.plot}
        </GlassCard>
      ))}
    </div>
  )
}

function POSITION_COUNTS(players: Player[]) {
  const map = new Map<string, number>()
  players.forEach(p => map.set(p.position_group, (map.get(p.position_group) ?? 0) + 1))
  const labels = [...map.keys()].sort()
  return { labels, values: labels.map(l => map.get(l) ?? 0) }
}

function CLUSTER_COUNTS(players: Player[]) {
  const map = new Map<string, number>()
  players.forEach(p => {
    const k = `C${p.cluster_id ?? 0}`
    map.set(k, (map.get(k) ?? 0) + 1)
  })
  const labels = [...map.keys()].sort()
  return { labels, values: labels.map(l => map.get(l) ?? 0) }
}
