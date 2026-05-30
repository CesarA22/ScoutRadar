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
    <section id={id} className="py-24 sm:py-32 lg:py-40 scroll-mt-24">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        <div
          className={`grid lg:grid-cols-[1fr_1.15fr] gap-14 lg:gap-20 xl:gap-28 items-center ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="space-y-6 sm:space-y-8 min-w-0"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              {icon}
              <span className="text-fut-emerald text-sm sm:text-base font-semibold tracking-widest uppercase">
                {eyebrow}
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-[3.25rem] font-bold leading-[1.1]"
            >
              {title}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/60 text-lg sm:text-xl leading-relaxed max-w-xl"
            >
              {description}
            </motion.p>
            {bullets && bullets.length > 0 && (
              <motion.ul variants={fadeUp} className="space-y-4 sm:space-y-5 pt-1">
                {bullets.map(b => (
                  <li key={b} className="flex items-start gap-3 text-white/75 text-base sm:text-lg">
                    <span className="mt-2 w-2.5 h-2.5 rounded-full bg-fut-gold shrink-0" />
                    {b}
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.div>

          <div className="w-full min-w-0">
            <VideoFrame videoKey={videoKey} />
          </div>
        </div>
      </div>
    </section>
  )
}
