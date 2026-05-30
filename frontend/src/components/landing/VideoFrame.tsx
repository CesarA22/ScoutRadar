import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src])

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="gradient-border rounded-2xl lg:rounded-3xl p-[1px] shadow-glow-gold/20 w-full"
      >
        <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-fut-card w-full">
          <div className="relative w-full min-h-[280px] sm:min-h-[380px] md:min-h-[460px] lg:min-h-[560px] xl:min-h-[640px] bg-fut-bg flex items-center justify-center">
            {isLoading && !directUrls && (
              <Spinner className="w-10 h-10" />
            )}
            {isError && !directUrls && !isLoading && (
              <p className="text-white/40 text-sm px-6 text-center">
                Video indisponivel no momento.
              </p>
            )}
            {src && (
              <video
                ref={videoRef}
                key={src}
                className="w-full h-full max-h-[80vh] object-contain"
                src={src}
                poster={poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
