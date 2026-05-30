import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { DemoVideoKey } from '../../lib/videos'
import { VideoFrame } from './VideoFrame'

interface FeatureSectionProps {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets?: string[]
  videoKey: DemoVideoKey
  reverse?: boolean
  icon?: ReactNode
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  videoKey,
  reverse = false,
  icon,
}: FeatureSectionProps) {
  return (
    <section id={id} className="py-20 sm:py-28 lg:py-32 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="space-y-6"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              {icon}
              <span className="text-fut-emerald text-sm font-semibold tracking-widest uppercase">
                {eyebrow}
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            >
              {title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 text-lg leading-relaxed max-w-xl">
              {description}
            </motion.p>
            {bullets && bullets.length > 0 && (
              <motion.ul variants={fadeUp} className="space-y-3">
                {bullets.map(b => (
                  <li key={b} className="flex items-start gap-3 text-white/70">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-fut-gold shrink-0" />
                    {b}
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <VideoFrame videoKey={videoKey} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
