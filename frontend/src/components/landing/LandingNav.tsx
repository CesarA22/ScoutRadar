import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'

interface LandingNavProps {
  onInterestClick: () => void
}

export function LandingNav({ onInterestClick }: LandingNavProps) {
  const { isAuthenticated } = useAuth()
  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ['rgba(7,10,18,0)', 'rgba(13,19,32,0.95)'])
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', v => setScrolled(v > 40))

  return (
    <motion.header
      style={{ backgroundColor: navBg }}
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow ${scrolled ? 'shadow-lg border-b border-white/10' : ''}`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-fut-gold to-fut-emerald flex items-center justify-center font-display font-extrabold text-fut-bg shadow-glow-gold"
            whileHover={{ scale: 1.05 }}
          >
            SR
          </motion.div>
          <span className="font-display text-xl sm:text-2xl font-bold text-fut-gold hidden sm:block">Scout Radar</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-fut-gold transition-colors">Recursos</a>
          <a href="#contact" className="hover:text-fut-gold transition-colors">Contato</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onInterestClick} className="hidden sm:inline-flex">
            Estou interessado
          </Button>
          <Link to={isAuthenticated ? '/explorer' : '/login'}>
            <Button variant="gold">
              {isAuthenticated ? 'Abrir app' : 'Entrar'}
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
