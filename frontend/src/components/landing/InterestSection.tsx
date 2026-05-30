import { motion } from 'framer-motion'
import { Button } from '../ui/Button'

interface InterestSectionProps {
  onInterestClick: () => void
}

export function InterestSection({ onInterestClick }: InterestSectionProps) {
  return (
    <section id="contact" className="py-20 sm:py-28 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-3xl p-10 sm:p-14 text-center gradient-border relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-fut-gold/5 via-transparent to-fut-emerald/5 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Pronto para revolucionar seu scouting?
            </h2>
            <p className="text-white/55 text-lg mb-8 max-w-xl mx-auto">
              Entre em contato e descubra como o Scout Radar pode transformar a forma
              como sua equipe identifica e avalia talentos.
            </p>
            <Button variant="gold" onClick={onInterestClick} className="text-base px-10">
              Estou interessado
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
