import type { FifaAttributes } from '../../lib/fifa'

const LABELS: (keyof FifaAttributes)[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']

interface RadarChartProps {
  attrs: FifaAttributes
  compare?: FifaAttributes
  size?: number
  className?: string
}

function hexPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
      const dist = (v / 99) * r
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      return `${x},${y}`
    })
    .join(' ')
}

export function RadarChart({ attrs, compare, size = 200, className = '' }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const mainVals = LABELS.map(k => attrs[k])
  const compareVals = compare ? LABELS.map(k => compare[k]) : null

  const grids = [0.25, 0.5, 0.75, 1].map(scale => hexPoints(cx, cy, r * scale, [99, 99, 99, 99, 99, 99]))

  return (
    <svg width={size} height={size} className={className} viewBox={`0 0 ${size} ${size}`}>
      {grids.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {LABELS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const x2 = cx + Math.cos(angle) * r
        const y2 = cy + Math.sin(angle) * r
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(255,255,255,0.06)" />
      })}
      {compareVals && (
        <polygon
          points={hexPoints(cx, cy, r, compareVals)}
          fill="rgba(91, 141, 239, 0.25)"
          stroke="rgba(91, 141, 239, 0.7)"
          strokeWidth="1.5"
        />
      )}
      <polygon
        points={hexPoints(cx, cy, r, mainVals)}
        fill="rgba(16, 217, 121, 0.35)"
        stroke="#10d979"
        strokeWidth="2"
      />
      {LABELS.map((label, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const lx = cx + Math.cos(angle) * (r + 16)
        const ly = cy + Math.sin(angle) * (r + 16)
        return (
          <text
            key={label}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white/50 text-[9px] font-stats font-bold"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
