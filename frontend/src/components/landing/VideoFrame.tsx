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

const crystalHeights =
  'min-h-[280px] sm:min-h-[380px] md:min-h-[460px] lg:min-h-[560px] xl:min-h-[640px]'

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
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55 }}
        className="crystal-glow w-full"
      >
        <div className={`crystal-frame crystal-clip relative w-full ${crystalHeights}`}>
          <div className="crystal-clip-inner absolute inset-[4px] bg-fut-bg overflow-hidden">
            {isLoading && !directUrls && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Spinner className="w-10 h-10" />
              </div>
            )}
            {isError && !directUrls && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
                <p className="text-white/40 text-sm text-center">
                  Video indisponivel no momento.
                </p>
              </div>
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
            <div className="crystal-facet absolute inset-0 z-[1]" aria-hidden />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
