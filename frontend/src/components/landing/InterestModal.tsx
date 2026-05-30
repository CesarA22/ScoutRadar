import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Button } from '../ui/Button'

interface InterestModalProps {
  open: boolean
  onClose: () => void
}

export function InterestModal({ open, onClose }: InterestModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Interesse no Scout Radar')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setError('')
        setSuccess(false)
      }, 300)
      return () => clearTimeout(t)
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.contact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
      setSuccess(true)
      setName('')
      setEmail('')
      setSubject('Interesse no Scout Radar')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg glass-strong rounded-2xl p-6 sm:p-8 gradient-border max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fut-gold/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-fut-gold" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Estou interessado</h2>
                    <p className="text-sm text-white/50">Conte-nos sobre seu interesse</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <p className="text-fut-emerald text-lg font-semibold mb-2">Mensagem enviada!</p>
                  <p className="text-white/60 text-sm mb-6">Obrigado pelo interesse. Entraremos em contato em breve.</p>
                  <Button variant="gold" onClick={onClose}>Fechar</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5" htmlFor="contact-name">Nome</label>
                    <input
                      id="contact-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5" htmlFor="contact-email">Seu e-mail</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5" htmlFor="contact-subject">Assunto</label>
                    <input
                      id="contact-subject"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5" htmlFor="contact-message">Mensagem</label>
                    <textarea
                      id="contact-message"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-fut-card border border-white/10 focus:border-fut-gold/50 focus:outline-none resize-none"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button type="submit" variant="gold" loading={loading} className="w-full">
                    Enviar mensagem
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
