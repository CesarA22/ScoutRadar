import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { DemoVideoKey } from '../../lib/videos'
import { getDemoPosterUrl, getDemoVideoUrl, useDirectVideoUrls } from '../../lib/videos'

/** Same-origin path — nginx/vite proxy forwards to backend (never cross-origin). */
export function demoVideoStreamUrl(key: DemoVideoKey): string {
  return `/api/v1/demo-videos/${key}/stream`
}

interface VideoFrameProps {
  videoKey: DemoVideoKey
  className?: string
}

export function VideoFrame({ videoKey, className = '' }: VideoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const directUrls = useDirectVideoUrls()
  const [failed, setFailed] = useState(false)

  const src = directUrls ? getDemoVideoUrl(videoKey) : demoVideoStreamUrl(videoKey)
  const poster = directUrls ? getDemoPosterUrl(videoKey) : undefined

  useEffect(() => {
    setFailed(false)
  }, [src])

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
        <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-fut-card w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">
          <div className="relative w-full aspect-video max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] xl:max-h-[400px] bg-fut-bg flex items-center justify-center">
            {failed && (
              <p className="text-white/40 text-sm px-6 text-center">
                Video indisponivel no momento.
              </p>
            )}
            {!failed && (
              <video
                ref={videoRef}
                key={src}
                className="w-full h-full object-contain"
                src={src}
                poster={poster}
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
