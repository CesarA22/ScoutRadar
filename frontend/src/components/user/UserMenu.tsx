import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Settings, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PreferencesModal } from './PreferencesModal'
import { ProfileModal } from './ProfileModal'
import { UserAvatar } from './UserAvatar'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (!user) return null

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-white/80 max-w-[140px] truncate">
            {user.username}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-xl border border-white/10 shadow-2xl py-1 z-50"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white text-left"
                onClick={() => {
                  setOpen(false)
                  setProfileOpen(true)
                }}
              >
                <User className="w-4 h-4 text-fut-gold" />
                {t('my_profile')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white text-left"
                onClick={() => {
                  setOpen(false)
                  setPrefsOpen(true)
                }}
              >
                <Settings className="w-4 h-4 text-fut-emerald" />
                {t('preferences')}
              </button>
              <div className="my-1 border-t border-white/10" />
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-red-300 text-left"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  )
}
