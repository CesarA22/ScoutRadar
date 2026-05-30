import { useQuery } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { api } from '../../api/client'
import type { DemoVideoKey } from '../../lib/videos'
import { getDemoPosterUrl, getDemoVideoUrl, useDirectVideoUrls } from '../../lib/videos'
import { Spinner } from '../ui/Spinner'

interface VideoFrameProps {
  videoKey: DemoVideoKey
  className?: string
}

export function VideoFrame({ videoKey, className = '' }: VideoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const directUrls = useDirectVideoUrls()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [24, -24])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['demo-video', videoKey],
    queryFn: () => api.getDemoVideoUrl(videoKey),
    enabled: !directUrls,
    staleTime: 50 * 60 * 1000,
    retry: 1,
  })

  const src = directUrls ? getDemoVideoUrl(videoKey) : data?.url
  const poster = directUrls
    ? getDemoPosterUrl(videoKey)
    : (data?.poster_url ?? getDemoPosterUrl(videoKey))

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src])

  return (
    <motion.div ref={containerRef} style={{ y }} className={className}>
      <div className="gradient-border rounded-2xl p-[1px] shadow-glow-gold/30">
        <div className="rounded-2xl overflow-hidden bg-fut-card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-fut-surface/80">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-fut-gold/80" />
            <span className="w-3 h-3 rounded-full bg-fut-emerald/80" />
            <span className="ml-2 text-xs text-white/40 font-mono">scout-radar.demo</span>
          </div>
          <div className="relative aspect-[16/10] bg-fut-bg flex items-center justify-center">
            {isLoading && !directUrls && (
              <Spinner className="w-10 h-10" />
            )}
            {isError && !directUrls && !isLoading && (
              <p className="text-white/40 text-sm px-6 text-center">
                Vídeo indisponível. Envie os arquivos ao bucket (veja docs/LANDING_SETUP.md).
              </p>
            )}
            {src && (
              <video
                ref={videoRef}
                key={src}
                className="absolute inset-0 w-full h-full object-cover"
                src={src}
                poster={poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-fut-bg/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
