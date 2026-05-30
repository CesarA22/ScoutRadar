const BASE = (import.meta.env.VITE_VIDEO_BASE_URL ?? '').replace(/\/+$/, '')

/** True when VITE_VIDEO_BASE_URL points at a public bucket/CDN (direct URLs). */
export function useDirectVideoUrls(): boolean {
  return BASE.length > 0
}

export type DemoVideoKey = 'outliers' | 'compare' | 'chat'

const FILES: Record<DemoVideoKey, { file: string; poster?: string }> = {
  outliers: { file: 'outliers.mp4', poster: 'outliers-poster.jpg' },
  compare: { file: 'compare.mp4', poster: 'compare-poster.jpg' },
  chat: { file: 'chat.mp4', poster: 'chat-poster.jpg' },
}

function asset(path: string): string {
  if (BASE) return `${BASE}/${path.replace(/^\//, '')}`
  return `/videos/${path.replace(/^\//, '')}`
}

export function getDemoVideoUrl(key: DemoVideoKey): string {
  return asset(FILES[key].file)
}

export function getDemoPosterUrl(key: DemoVideoKey): string | undefined {
  const poster = FILES[key].poster
  return poster ? asset(poster) : undefined
}
