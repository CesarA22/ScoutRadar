interface SilhouetteProps {
  className?: string
  variant?: 'default' | 'mini'
}

export function Silhouette({ className = '', variant = 'default' }: SilhouetteProps) {
  const h = variant === 'mini' ? 80 : 140
  return (
    <svg
      viewBox="0 0 120 160"
      className={`w-full max-w-[120px] mx-auto opacity-90 ${className}`}
      style={{ height: h }}
      aria-hidden
    >
      <defs>
        <linearGradient id="silGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="28" rx="22" ry="24" fill="url(#silGrad)" />
      <path
        d="M30 52 Q60 48 90 52 L95 95 Q60 88 25 95 Z"
        fill="url(#silGrad)"
      />
      <path
        d="M35 95 L28 155 M85 95 L92 155 M50 95 L45 155 M70 95 L75 155"
        stroke="rgba(0,0,0,0.7)"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
