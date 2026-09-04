import { FileText, History, LayoutDashboard, MessagesSquare, PanelLeft, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import type { AppView } from '../types/nav';
import { BrandMark } from './BrandMark';
import { NavUserMenu } from './NavUserMenu';

interface AdminSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  user: AuthUser | null;
  onChangePassword: () => void;
  onLogout: () => void;
  onCloseSidebar: () => void;
}

const NAV_ITEMS: { view: AppView; label: string; icon: LucideIcon }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'documents', label: 'Documents', icon: FileText },
  { view: 'ask', label: 'Ask Documents', icon: MessagesSquare },
  { view: 'history', label: 'Chat History', icon: History },
  { view: 'users', label: 'Users', icon: Users },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar = ({
  activeView,
  onViewChange,
  user,
  onChangePassword,
  onLogout,
  onCloseSidebar,
}: AdminSidebarProps) => {
  return (
    <aside className="side-nav">
      <div className="side-nav__brand">
        <BrandMark />
        <div>
          <div className="side-nav__brand-title">RAG Assistant</div>
          <div className="side-nav__brand-subtitle">AI Document Intelligence</div>
        </div>

        <button className="side-nav__close" type="button" onClick={onCloseSidebar} aria-label="Hide sidebar">
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
      </div>

      <nav className="side-nav__items" aria-label="Main">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = view === activeView;

          return (
            <button
              key={view}
              type="button"
              className={`side-nav__item${isActive ? ' side-nav__item--active' : ''}`}
              onClick={() => onViewChange(view)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.75} className="side-nav__item-icon" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="side-nav__footer">
        <NavUserMenu
          user={user}
          onChangePassword={onChangePassword}
          onLogout={onLogout}
          onOpenSettings={() => onViewChange('settings')}
        />
      </div>
    </aside>
  );
};
