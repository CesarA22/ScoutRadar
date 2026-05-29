import { useEffect, useState } from 'react'

export function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return width
}

export function useResponsiveSize(small: number, large: number, breakpoint = 1024) {
  const width = useViewportWidth()
  if (width >= 1536) return Math.round(large * 1.15)
  if (width >= breakpoint) return large
  if (width >= 640) return Math.round((small + large) / 2)
  return small
}
