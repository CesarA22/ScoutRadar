import { motion } from 'framer-motion'
import { Lock, User } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/explorer'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch {
      setError('Usuário ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fut-bg min-h-[100dvh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fut-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fut-emerald/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-fut-gold to-fut-emerald flex items-center justify-center font-display font-extrabold text-fut-bg text-xl shadow-glow-gold"
            whileHover={{ scale: 1.05 }}
          >
            SR
          </motion.div>
          <span className="font-display text-2xl font-bold text-fut-gold group-hover:text-white transition-colors">
            Scout Radar
          </span>
        </Link>

        <div className="glass-strong rounded-2xl p-8 gradient-border">
          <h1 className="font-display text-3xl font-bold text-center mb-2">Entrar</h1>
          <p className="text-white/50 text-center text-sm mb-8">
            Acesse a plataforma de scouting com IA
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2" htmlFor="username">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none focus:ring-1 focus:ring-fut-gold/30 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2" htmlFor="password">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none focus:ring-1 focus:ring-fut-gold/30 transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" variant="gold" loading={loading} className="w-full">
              Acessar plataforma
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-white/40 text-sm">
          <Link to="/" className="hover:text-fut-gold transition-colors">Voltar para a landing</Link>
        </p>
      </motion.div>
    </div>
  )
}
