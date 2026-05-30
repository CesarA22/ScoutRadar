import { User } from 'lucide-react'
import { mediaUrl } from '../../api/client'

interface UserAvatarProps {
  username: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
  className?: string
}

const sizes = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
}

export function UserAvatar({ username, avatarUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const src = mediaUrl(avatarUrl)
  const initial = username.charAt(0).toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizes[size]} rounded-full object-cover border-2 border-fut-gold/40 shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-fut-gold/80 to-fut-emerald/80 flex items-center justify-center font-display font-bold text-fut-bg border-2 border-white/10 shrink-0 ${className}`}
      aria-hidden
    >
      {initial || <User className="w-4 h-4" />}
    </div>
  )
}
