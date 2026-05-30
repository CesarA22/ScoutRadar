import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { setToken } from '../../auth/token'
import { Button } from '../ui/Button'
import { UserAvatar } from './UserAvatar'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { t } = useTranslation()
  const { user, setUser, refreshUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [emailOk, setEmailOk] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user) return
    setUsername(user.username)
    setEmail(user.email ?? '')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setUsernameOk(null)
    setEmailOk(null)
    setError('')
  }, [open, user])

  useEffect(() => {
    if (!open || !user) return
    const uname = username.trim()
    if (!uname || uname === user.username) {
      setUsernameOk(uname ? true : null)
      return
    }
    const timer = setTimeout(() => {
      api.checkAvailability({ username: uname })
        .then(r => setUsernameOk(r.username_available))
        .catch(() => setUsernameOk(null))
    }, 400)
    return () => clearTimeout(timer)
  }, [username, user, open])

  useEffect(() => {
    if (!open || !user) return
    const addr = email.trim().toLowerCase()
    if (!addr || addr === (user.email ?? '').toLowerCase()) {
      setEmailOk(addr ? true : null)
      return
    }
    const timer = setTimeout(() => {
      api.checkAvailability({ email: addr })
        .then(r => setEmailOk(r.email_available))
        .catch(() => setEmailOk(null))
    }, 400)
    return () => clearTimeout(timer)
  }, [email, user, open])

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: u => {
      setUser(u)
      setError('')
    },
    onError: (e: Error) => setError(e.message),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const changingSensitive =
        username.trim() !== user!.username ||
        email.trim().toLowerCase() !== (user!.email ?? '').toLowerCase() ||
        Boolean(newPassword)

      if (changingSensitive && !currentPassword) {
        throw new Error(t('password_required'))
      }
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error(t('passwords_mismatch'))
      }
      if (usernameOk === false) throw new Error(t('username_taken'))
      if (emailOk === false) throw new Error(t('email_taken'))

      return api.updateProfile({
        username: username.trim() !== user!.username ? username.trim() : undefined,
        email: email.trim() || undefined,
        current_password: changingSensitive ? currentPassword : undefined,
        new_password: newPassword || undefined,
      })
    },
    onSuccess: async res => {
      if (res.access_token) setToken(res.access_token)
      setUser(res.user)
      await refreshUser()
      setError('')
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 glass-strong rounded-2xl border border-white/10 shadow-2xl max-h-[90dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 glass-strong border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">{t('my_profile')}</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="md" />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) avatarMutation.mutate(f)
                    e.target.value = ''
                  }}
                />
                <Button
                  variant="secondary"
                  loading={avatarMutation.isPending}
                  onClick={() => fileRef.current?.click()}
                  className="!py-2 !px-4 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  {t('change_avatar')}
                </Button>
              </div>

              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">{t('username')}</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:border-fut-gold/50 outline-none"
                  autoComplete="username"
                />
                {usernameOk === false && <p className="text-red-400 text-xs mt-1">{t('username_taken')}</p>}
                {usernameOk === true && username.trim() !== user.username && (
                  <p className="text-fut-emerald text-xs mt-1">{t('username_available')}</p>
                )}
              </label>

              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">{t('email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:border-fut-gold/50 outline-none"
                  autoComplete="email"
                />
                {emailOk === false && <p className="text-red-400 text-xs mt-1">{t('email_taken')}</p>}
                {emailOk === true && email.trim().toLowerCase() !== (user.email ?? '').toLowerCase() && (
                  <p className="text-fut-emerald text-xs mt-1">{t('email_available')}</p>
                )}
              </label>

              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">{t('current_password')}</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:border-fut-gold/50 outline-none"
                  autoComplete="current-password"
                />
              </label>

              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">{t('new_password')}</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:border-fut-gold/50 outline-none"
                  autoComplete="new-password"
                />
              </label>

              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">{t('confirm_password')}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-white focus:border-fut-gold/50 outline-none"
                  autoComplete="new-password"
                />
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                variant="gold"
                className="w-full"
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {t('save_profile')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
