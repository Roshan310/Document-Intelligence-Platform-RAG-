import type { ChatConversation } from '../types/chat';
import type { AuthUser } from '../types/auth';

interface ChatHeaderProps {
  conversation: ChatConversation | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: AuthUser | null;
}

export const ChatHeader = ({ conversation, isSidebarOpen, onToggleSidebar, user }: ChatHeaderProps) => {
  return (
    <header className="chat-header">
      <div className="chat-header__left">
        <button
          className="chat-header__menu-button"
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-pressed={isSidebarOpen}
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>

        <div>
          <div className="chat-header__eyebrow">Workspace assistant</div>
          <h1 className="chat-header__title">{conversation?.title ?? 'Conversation'}</h1>
        </div>
      </div>

      <div className="chat-header__meta">
        <span className="pill pill--accent">{user?.role ?? 'Guest'}</span>
        <span className="chat-header__subtitle">{conversation?.subtitle ?? 'Choose a thread from the sidebar'}</span>
      </div>
    </header>
  );
};