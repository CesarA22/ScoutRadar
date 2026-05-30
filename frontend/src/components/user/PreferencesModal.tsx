import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import type { AppLanguage, AppTheme } from '../../lib/preferences'
import { applyUserPreferences } from '../../lib/preferences'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

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

  useEffect(() => {
    if (open) applyUserPreferences(theme, language)
  }, [theme, language, open])

  const saveMutation = useMutation({
    mutationFn: () => api.updateProfile({ theme, language }),
    onSuccess: res => {
      setUser(res.user)
      applyUserPreferences(theme, language)
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  if (!user) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 glass-strong rounded-2xl border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">{t('preferences')}</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider mb-3">{t('theme')}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'border-fut-gold bg-fut-gold/15 text-fut-gold'
                        : 'border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    {t('dark_mode')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                      theme === 'light'
                        ? 'border-fut-gold bg-fut-gold/15 text-fut-gold'
                        : 'border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    {t('light_mode')}
                  </button>
                </div>
              </div>

              <Select
                label={t('language')}
                value={language}
                onChange={e => {
                  const lang = e.target.value as AppLanguage
                  setLanguage(lang)
                  void i18n.changeLanguage(lang)
                }}
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </Select>

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
        </>
      )}
    </AnimatePresence>
  )
}
