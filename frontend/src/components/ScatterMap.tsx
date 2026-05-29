import Plot from 'react-plotly.js'
import { CLUSTER_COLORS } from './Sidebar'
import type { Player } from '../types'

interface ScatterMapProps {
  players: Player[]
  onSelect: (player: Player) => void
  selectedKey?: string
}

export function ScatterMap({ players, onSelect, selectedKey }: ScatterMapProps) {
  const withCoords = players.filter(p => p.umap_x != null && p.umap_y != null)
  const clusters = [...new Set(withCoords.map(p => p.cluster_id ?? 0))]

  const traces = clusters.map(clusterId => {
    const pts = withCoords.filter(p => (p.cluster_id ?? 0) === clusterId)
    return {
      x: pts.map(p => p.umap_x!),
      y: pts.map(p => p.umap_y!),
      text: pts.map(p => `${p.player}<br>${p.team}<br>Prospect: ${p.prospect_score?.toFixed(2) ?? 'N/A'}`),
      customdata: pts.map(p => p.player_key),
      mode: 'markers' as const,
      type: 'scatter' as const,
      name: `Cluster ${clusterId}`,
      marker: {
        size: pts.map(p => (p.player_key === selectedKey ? 14 : 8)),
        color: CLUSTER_COLORS[(clusterId + CLUSTER_COLORS.length) % CLUSTER_COLORS.length],
        opacity: 0.85,
        line: { width: 1, color: '#ffffff44' },
      },
      hovertemplate: '%{text}<extra></extra>',
    }
  })

  return (
    <Plot
      data={traces}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor: '#16161e',
        font: { color: '#f0f0f5', size: 12 },
        margin: { l: 40, r: 20, t: 30, b: 40 },
        xaxis: { title: 'Dimensão 1', gridcolor: '#2a2a38', zerolinecolor: '#2a2a38' },
        yaxis: { title: 'Dimensão 2', gridcolor: '#2a2a38', zerolinecolor: '#2a2a38' },
        legend: { orientation: 'h', y: -0.15 },
        hovermode: 'closest',
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
      onClick={ev => {
        const key = ev.points?.[0]?.customdata
        if (key) {
          const player = withCoords.find(p => p.player_key === key)
          if (player) onSelect(player)
        }
      }}
    />
  )
}
