import { motion } from 'framer-motion'
import { ArrowDown, BarChart3, MessageSquare, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'

interface HeroProps {
  onInterestClick: () => void
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero({ onInterestClick }: HeroProps) {
  const { isAuthenticated } = useAuth()

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-fut-gold/8 blur-[100px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-fut-emerald/8 blur-[80px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <motion.div variants={item} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
          <Sparkles className="w-4 h-4 text-fut-gold" />
          <span className="text-sm text-white/70">Scouting de futebol com inteligência artificial</span>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
        >
          <span className="text-white">Descubra talentos</span>
          <br />
          <span className="bg-gradient-to-r from-fut-gold via-fut-emerald to-fut-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
            antes de todo mundo
          </span>
        </motion.h1>

        <motion.p variants={item} className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
          Scout Radar combina dados avançados, detecção de outliers e um assistente de IA
          para acelerar suas decisões de scouting — tudo em uma interface premium.
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-4">
          <Link to={isAuthenticated ? '/explorer' : '/login'}>
            <Button variant="gold" className="text-base px-8">
              {isAuthenticated ? 'Ir para o app' : 'Começar agora'}
            </Button>
          </Link>
          <Button variant="secondary" onClick={onInterestClick}>
            Estou interessado
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-16 flex flex-wrap justify-center gap-8 text-white/40 text-sm"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-fut-emerald" /> Outliers
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fut-gold" /> Comparação
          </span>
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-fut-emerald" /> Chat IA
          </span>
        </motion.div>
      </motion.div>

      <motion.a
        href="#features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-fut-gold transition-colors"
        aria-label="Ver recursos"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </motion.a>
    </section>
  )
}
