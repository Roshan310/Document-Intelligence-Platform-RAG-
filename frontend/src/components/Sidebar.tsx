import type { ChatConversation } from '../types/chat';
import type { AuthUser } from '../types/auth';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  onLogout?: () => void;
  onOpenPasswordModal?: () => void;
  user: AuthUser | null;
  activeView: 'chat' | 'admin';
  onViewChange: (view: 'chat' | 'admin') => void;
  onCloseSidebar?: () => void;
}

export const Sidebar = ({
  conversations,
  activeConversationId,
  searchTerm,
  onSearchTermChange,
  onSelectConversation,
  onCreateConversation,
  onLogout,
  onOpenPasswordModal,
  user,
  activeView,
  onViewChange,
  onCloseSidebar,
}: SidebarProps) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredConversations = normalizedSearch
    ? conversations.filter((conversation) => {
        const combinedText = [conversation.title, conversation.subtitle, ...conversation.tags].join(' ').toLowerCase();
        return combinedText.includes(normalizedSearch);
      })
    : conversations;

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="brand-row">
          {/* <div className="brand-mark">R</div> */}
          <div>
            <div className="brand-title">RAG Workspace</div>
            {/* <div className="brand-subtitle">{user?.email ?? 'Authenticated workspace'}</div> */}
          </div>
        </div>

        {/* <button className="sidebar__close" type="button" onClick={onCloseSidebar} aria-label="Close sidebar">
          ×
        </button> */}
      </div>

      <button className="sidebar__primary-action" type="button" onClick={onCreateConversation}>
        + New chat
      </button>

      {user?.role === 'admin' ? (
        <div className="sidebar__nav">
          <button
            type="button"
            className={`sidebar__nav-button${activeView === 'chat' ? ' sidebar__nav-button--active' : ''}`}
            onClick={() => onViewChange('chat')}
          >
            Chat
          </button>
          <button
            type="button"
            className={`sidebar__nav-button${activeView === 'admin' ? ' sidebar__nav-button--active' : ''}`}
            onClick={() => onViewChange('admin')}
          >
            Admin docs
          </button>
        </div>
      ) : null}

      <label className="search-box">
        <span className="search-box__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          type="search"
          placeholder="Search conversations"
          aria-label="Search conversations"
        />
      </label>

      <div className="sidebar__section-label">Recent chats</div>

      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="sidebar__empty">No conversations match that filter.</div>
        ) : (
          filteredConversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-card${isActive ? ' conversation-card--active' : ''}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-card__header">
                  <span className="conversation-card__title">{conversation.title}</span>
                  <span className="conversation-card__time">{conversation.updatedAt}</span>
                </div>
                {/* <p className="conversation-card__subtitle">{conversation.subtitle}</p> */}
                {/* <div className="conversation-card__tags">
                  {conversation.tags.map((tag) => (
                    <span key={tag} className="pill pill--muted">
                      {tag}
                    </span>
                  ))}
                </div> */}
              </button>
            );
          })
        )}
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__footer-main">
          <UserAvatar user={user} size={30} />
          <div className="sidebar__footer-copy">
            <div className="sidebar__footer-email">{user?.email ?? 'Signed in'}</div>
            {/* <div className="sidebar__footer-subtitle">{user?.role === 'admin' ? 'Admin access' : 'User access'}</div> */}
          </div>
        </div>
        {onLogout ? (
          <div className="sidebar__footer-actions">
            {onOpenPasswordModal ? (
              <button className="sidebar__logout-button" type="button" onClick={onOpenPasswordModal}>
                Password
              </button>
            ) : null}
            <button className="sidebar__logout-button" type="button" onClick={onLogout}>
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
