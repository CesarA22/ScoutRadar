import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { setToken } from '../auth/token'
import { Button, GlassCard, Spinner } from '../components/ui'
import { UserAvatar } from '../components/user/UserAvatar'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
        {hint}
      </div>
      {children}
    </div>
  )
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, setUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [emailOk, setEmailOk] = useState<boolean | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setUsername(user.username)
    setEmail(user.email ?? '')
  }, [user])

  useEffect(() => {
    if (!user) return
    const uname = username.trim()
    if (!uname || uname === user.username) { setUsernameOk(null); return }
    const t = setTimeout(() => {
      api.checkAvailability({ username: uname })
        .then(r => setUsernameOk(r.username_available))
        .catch(() => setUsernameOk(null))
    }, 400)
    return () => clearTimeout(t)
  }, [username, user])

  useEffect(() => {
    if (!user) return
    const addr = email.trim().toLowerCase()
    if (!addr || addr === (user.email ?? '').toLowerCase()) { setEmailOk(null); return }
    const t = setTimeout(() => {
      api.checkAvailability({ email: addr })
        .then(r => setEmailOk(r.email_available))
        .catch(() => setEmailOk(null))
    }, 400)
    return () => clearTimeout(t)
  }, [email, user])

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: u => { setUser(u); setError('') },
    onError: (e: Error) => setError(e.message),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('No user')
      if (usernameOk === false) throw new Error(t('username_taken'))
      if (emailOk === false) throw new Error(t('email_taken'))

      const changingSensitive =
        username.trim() !== user.username ||
        email.trim().toLowerCase() !== (user.email ?? '').toLowerCase() ||
        Boolean(newPassword)

      if (changingSensitive && !currentPassword) throw new Error(t('password_required'))
      if (newPassword && newPassword !== confirmPassword) throw new Error(t('passwords_mismatch'))

      return api.updateProfile({
        username: username.trim() !== user.username ? username.trim() : undefined,
        email: email.trim() || undefined,
        current_password: changingSensitive ? currentPassword : undefined,
        new_password: newPassword || undefined,
      })
    },
    onSuccess: async res => {
      if (res.access_token) setToken(res.access_token)
      setUser(res.user)
      await refreshUser()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => setError(e.message),
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    )
  }

  const isSensitiveChange =
    username.trim() !== user.username ||
    email.trim().toLowerCase() !== (user.email ?? '').toLowerCase() ||
    Boolean(newPassword)

  return (
    <div className="page-shell max-w-xl mx-auto w-full pb-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="page-title">{t('my_profile')}</h2>
      </div>

      {/* Avatar */}
      <GlassCard>
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="lg" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {avatarMutation.isPending
                ? <Spinner className="w-5 h-5" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); e.target.value = '' }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-xl text-white truncate">{user.username}</p>
            {user.email && <p className="text-white/50 text-sm mt-0.5 truncate">{user.email}</p>}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="mt-2 text-sm text-fut-gold hover:text-fut-gold/70 transition-colors"
            >
              {t('change_avatar')}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Account info */}
      <GlassCard className="space-y-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Informações da conta</p>

        <Field
          label={t('username')}
          hint={usernameOk === true
            ? <span className="text-fut-emerald text-xs flex items-center gap-1"><Check className="w-3 h-3" />{t('username_available')}</span>
            : usernameOk === false
            ? <span className="text-red-400 text-xs">{t('username_taken')}</span>
            : null}
        >
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            className="app-input"
            autoComplete="username"
          />
        </Field>

        <Field
          label={t('email')}
          hint={emailOk === true
            ? <span className="text-fut-emerald text-xs flex items-center gap-1"><Check className="w-3 h-3" />{t('email_available')}</span>
            : emailOk === false
            ? <span className="text-red-400 text-xs">{t('email_taken')}</span>
            : null}
        >
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            className="app-input"
            autoComplete="email"
          />
        </Field>
      </GlassCard>

      {/* Password */}
      <GlassCard className="space-y-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Alterar senha</p>

        <Field label={t('new_password')}>
          <input
            type="password"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setError('') }}
            className="app-input"
            autoComplete="new-password"
            placeholder="Deixe em branco para manter a atual"
          />
        </Field>

        <Field label={t('confirm_password')}>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError('') }}
            className="app-input"
            autoComplete="new-password"
          />
        </Field>
      </GlassCard>

      {/* Current password confirmation */}
      {isSensitiveChange && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="border border-fut-gold/20 space-y-3">
            <p className="text-sm text-fut-gold/80">
              Confirme com sua senha atual para salvar as alterações.
            </p>
            <input
              type="password"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setError('') }}
              className="app-input"
              autoComplete="current-password"
              placeholder={t('current_password')}
            />
          </GlassCard>
        </motion.div>
      )}

      {error && (
        <p className="text-red-400 text-sm px-1">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-fut-emerald text-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {t('profile_saved')}
          </motion.span>
        )}
        <Button
          variant="gold"
          loading={saveMutation.isPending}
          onClick={() => { setError(''); saveMutation.mutate() }}
        >
          {t('save_profile')}
        </Button>
      </div>
    </div>
  )
}
