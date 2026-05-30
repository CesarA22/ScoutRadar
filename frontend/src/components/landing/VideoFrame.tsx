import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { DemoVideoKey } from '../../lib/videos'
import { getDemoVideoUrl } from '../../lib/videos'
import { Spinner } from '../ui/Spinner'

interface VideoFrameProps {
  videoKey: DemoVideoKey
  className?: string
}

export function VideoFrame({ videoKey, className = '' }: VideoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const staticSrc = getDemoVideoUrl(videoKey)
  const [src, setSrc] = useState(staticSrc)
  const [ready, setReady] = useState(false)
  const [useApi, setUseApi] = useState(false)
  const [failed, setFailed] = useState(false)
  const triedApi = useRef(false)

  const { data: apiData, isLoading: apiLoading } = useQuery({
    queryKey: ['demo-video', videoKey],
    queryFn: () => api.getDemoVideoUrl(videoKey),
    enabled: useApi,
    staleTime: 50 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    setSrc(staticSrc)
    setReady(false)
    setUseApi(false)
    setFailed(false)
    triedApi.current = false
  }, [staticSrc, videoKey])

  useEffect(() => {
    if (useApi && apiData?.url) {
      setSrc(apiData.url)
      setReady(false)
    }
  }, [useApi, apiData?.url])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src, ready])

  const showError = failed || (useApi && !apiLoading && !apiData?.url)
  const showSpinner = (!ready && !showError) || (useApi && apiLoading)

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
            {showSpinner && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Spinner className="w-10 h-10" />
              </div>
            )}
            {showError && (
              <p className="absolute inset-0 z-20 flex items-center justify-center text-white/40 text-sm px-6 text-center">
                Video indisponivel no momento.
              </p>
            )}
            {src && !showError && (
              <video
                ref={videoRef}
                key={src}
                className={`w-full h-full object-contain transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`}
                src={src}
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => setReady(true)}
                onCanPlay={() => setReady(true)}
                onError={() => {
                  if (!triedApi.current) {
                    triedApi.current = true
                    setUseApi(true)
                    return
                  }
                  setFailed(true)
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
