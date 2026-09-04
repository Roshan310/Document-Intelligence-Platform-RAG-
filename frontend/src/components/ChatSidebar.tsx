import { FileText, PanelLeft, Plus, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import type { ChatConversation } from '../types/chat';
import type { AppView } from '../types/nav';
import { BrandMark } from './BrandMark';
import { ConversationList } from './ConversationList';
import { NavUserMenu } from './NavUserMenu';

interface ChatSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  conversations: ChatConversation[];
  activeConversationId: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  user: AuthUser | null;
  onChangePassword: () => void;
  onLogout: () => void;
  onCloseSidebar: () => void;
}

// Chat is the home view — it is reached by picking a conversation or starting a new one,
// so it deliberately has no nav item of its own. Settings lives in the account menu.
const NAV_ITEMS: { view: AppView; label: string; icon: LucideIcon }[] = [
  { view: 'documents', label: 'Documents', icon: FileText },
];

export const ChatSidebar = ({
  activeView,
  onViewChange,
  conversations,
  activeConversationId,
  searchTerm,
  onSearchTermChange,
  onSelectConversation,
  onCreateConversation,
  user,
  onChangePassword,
  onLogout,
  onCloseSidebar,
}: ChatSidebarProps) => {
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

      <button className="btn btn--primary btn--block" type="button" onClick={onCreateConversation}>
        <Plus size={18} strokeWidth={1.75} />
        New chat
      </button>

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

      <label className="side-nav__search">
        <span className="sr-only">Search conversations</span>
        <span className="side-nav__search-icon" aria-hidden="true">
          <Search size={14} strokeWidth={1.75} />
        </span>
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          type="search"
          placeholder="Search conversations"
          aria-label="Search conversations"
        />
      </label>

      <div className="side-nav__section">
        <div className="side-nav__section-label">Recent chats</div>

        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
          variant="dark"
          emptyMessage="No conversations match that filter."
        />
      </div>

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
