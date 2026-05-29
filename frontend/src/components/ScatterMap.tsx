import Plot from 'react-plotly.js'
import { useTranslation } from 'react-i18next'
import { CLUSTER_COLORS } from '../lib/fifa'
import type { Player } from '../types'

interface ScatterMapProps {
  players: Player[]
  onSelect: (player: Player) => void
  selectedKey?: string
}

export function ScatterMap({ players, onSelect, selectedKey }: ScatterMapProps) {
  const { t } = useTranslation()
  const withCoords = players.filter(p => p.umap_x != null && p.umap_y != null)
  const clusters = [...new Set(withCoords.map(p => p.cluster_id ?? 0))]

  const traces = clusters.map(clusterId => {
    const pts = withCoords.filter(p => (p.cluster_id ?? 0) === clusterId)
    const color = CLUSTER_COLORS[(clusterId + CLUSTER_COLORS.length) % CLUSTER_COLORS.length]
    return {
      x: pts.map(p => p.umap_x!),
      y: pts.map(p => p.umap_y!),
      text: pts.map(p => `<b>${p.player}</b><br>${p.team}<br>Prospect: ${p.prospect_score?.toFixed(2) ?? '—'}`),
      customdata: pts.map(p => p.player_key),
      mode: 'markers' as const,
      type: 'scatter' as const,
      name: `Cluster ${clusterId}`,
      marker: {
        size: pts.map(p => (p.player_key === selectedKey ? 16 : 10)),
        color,
        opacity: 0.88,
        line: {
          color: pts.map(p => (p.player_key === selectedKey ? '#f4cf6b' : 'rgba(255,255,255,0.15)')),
          width: pts.map(p => (p.player_key === selectedKey ? 3 : 1)),
        },
      },
      hovertemplate: '%{text}<extra></extra>',
    }
  })

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(13, 19, 32, 0.6)',
        font: { color: 'rgba(255,255,255,0.7)', family: 'Inter', size: 11 },
        margin: { l: 48, r: 16, t: 24, b: 48 },
        xaxis: {
          title: { text: t('map_axis_x'), font: { color: 'rgba(244,207,107,0.6)', size: 11 } },
          gridcolor: 'rgba(255,255,255,0.06)',
          zerolinecolor: 'rgba(255,255,255,0.08)',
        },
        yaxis: {
          title: { text: t('map_axis_y'), font: { color: 'rgba(244,207,107,0.6)', size: 11 } },
          gridcolor: 'rgba(255,255,255,0.06)',
          zerolinecolor: 'rgba(255,255,255,0.08)',
        },
        legend: { orientation: 'h', y: -0.12, font: { size: 10 } },
        hovermode: 'closest',
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
      onClick={ev => {
        const key = ev.points?.[0]?.customdata as string | undefined
        const pt = key ? withCoords.find(p => p.player_key === key) : undefined
        if (pt) onSelect(pt)
      }}
    />
  )
}
