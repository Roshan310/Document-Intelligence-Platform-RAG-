import { useEffect, useRef, useState } from 'react';
import { ChevronDown, KeyRound, LogOut, Settings } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { getDisplayName, getRoleLabel } from '../lib/format';
import { UserAvatar } from './UserAvatar';

interface NavUserMenuProps {
  user: AuthUser | null;
  onChangePassword: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export const NavUserMenu = ({
  user,
  onChangePassword,
  onLogout,
  onOpenSettings,
}: NavUserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="nav-user" ref={containerRef}>
      {isOpen ? (
        <div className="nav-user__menu" role="menu">
          <div className="nav-user__email">{user?.email ?? 'Signed in'}</div>

          {onOpenSettings ? (
            <button
              className="nav-user__menu-item"
              type="button"
              role="menuitem"
              onClick={() => runAction(onOpenSettings)}
            >
              <Settings size={16} strokeWidth={1.75} />
              Settings
            </button>
          ) : null}

          <button
            className="nav-user__menu-item"
            type="button"
            role="menuitem"
            onClick={() => runAction(onChangePassword)}
          >
            <KeyRound size={16} strokeWidth={1.75} />
            Change password
          </button>

          <button
            className="nav-user__menu-item nav-user__menu-item--danger"
            type="button"
            role="menuitem"
            onClick={() => runAction(onLogout)}
          >
            <LogOut size={16} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      ) : null}

      <button
        className="nav-user__button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <UserAvatar user={user} size={34} />
        <span className="nav-user__meta">
          <span className="nav-user__name">{getDisplayName(user?.email)}</span>
          <span className="nav-user__role">{getRoleLabel(user?.role)}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`nav-user__chevron${isOpen ? ' nav-user__chevron--open' : ''}`}
        />
      </button>
    </div>
  );
};
