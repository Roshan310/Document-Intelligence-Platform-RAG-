import { useEffect, useState } from 'react';
import type { AuthUser } from '../types/auth';

interface UserAvatarProps {
  user: AuthUser | null;
  size?: number;
  className?: string;
}

export const UserAvatar = ({ user, size = 40, className = '' }: UserAvatarProps) => {
  const avatarUrl = user?.avatarUrl?.trim() ?? '';
  const fallback = user?.email?.trim().charAt(0).toUpperCase() || 'U';
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [avatarUrl]);

  const rootClassName = ['user-avatar', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClassName}
      style={{ width: size, height: size, fontSize: size }}
      role="img"
      aria-label={user ? `Avatar for ${user.email}` : 'User avatar'}
    >
      {avatarUrl && !hasImageError ? (
        <img
          className="user-avatar__image"
          src={avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="user-avatar__fallback">{fallback}</span>
      )}
    </div>
  );
};