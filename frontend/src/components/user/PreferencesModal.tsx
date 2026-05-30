import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import type { AppLanguage, AppTheme } from '../../lib/preferences'
import { applyLanguage, applyTheme } from '../../lib/preferences'
import { Button } from '../ui/Button'

const LANGS: { value: AppLanguage; label: string; flag: string }[] = [
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
]

interface PreferencesModalProps {
  open: boolean
  onClose: () => void
}

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const { t, i18n } = useTranslation()
  const { user, setUser } = useAuth()
  const [theme, setTheme] = useState<AppTheme>('dark')
  const [language, setLanguage] = useState<AppLanguage>('pt')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user) return
    setTheme(user.theme === 'light' ? 'light' : 'dark')
    setLanguage(user.language === 'en' || user.language === 'es' ? user.language : 'pt')
    setError('')
  }, [open, user])

  // Live preview
  useEffect(() => {
    if (!open) return
    applyTheme(theme)
    applyLanguage(language)
    void i18n.changeLanguage(language)
  }, [theme, language, open, i18n])

  const saveMutation = useMutation({
    mutationFn: () => api.updateProfile({ theme, language }),
    onSuccess: res => {
      setUser(res.user)
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  if (!user) return null

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full max-w-sm bg-fut-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <h3 className="font-display font-bold text-lg text-white">{t('preferences')}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">{t('theme')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-fut-gold bg-fut-gold/10 text-fut-gold'
                          : 'border-white/8 text-white/50 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('dark_mode')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-fut-gold bg-fut-gold/10 text-fut-gold'
                          : 'border-white/8 text-white/50 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('light_mode')}</span>
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">{t('language')}</p>
                  <div className="space-y-1.5">
                    {LANGS.map(l => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLanguage(l.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          language === l.value
                            ? 'border-fut-gold/60 bg-fut-gold/8 text-white'
                            : 'border-white/8 text-white/60 hover:border-white/20 hover:text-white/90'
                        }`}
                      >
                        <span className="text-xl leading-none">{l.flag}</span>
                        <span className="text-sm font-medium">{l.label}</span>
                        {language === l.value && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-fut-gold" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button
                  variant="gold"
                  className="w-full"
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {t('save_preferences')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
