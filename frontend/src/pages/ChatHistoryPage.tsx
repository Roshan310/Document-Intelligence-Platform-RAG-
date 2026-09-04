import { MessageSquare, Plus, Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import type { ChatConversation } from '../types/chat';

interface ChatHistoryPageProps {
  conversations: ChatConversation[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
}

export const ChatHistoryPage = ({
  conversations,
  searchTerm,
  onSearchTermChange,
  onSelectConversation,
  onCreateConversation,
}: ChatHistoryPageProps) => (
  <>
    <PageHeader
      title="Chat History"
      subtitle="Every thread you have started in this workspace."
      actions={
        <>
          <label className="search-field page-header__search">
            <span className="sr-only">Search conversations</span>
            <span className="search-field__icon" aria-hidden="true">
              <Search size={16} strokeWidth={1.75} />
            </span>
            <input
              className="input"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              type="search"
              placeholder="Search conversations..."
              aria-label="Search conversations"
            />
          </label>

          <button className="btn btn--primary" type="button" onClick={onCreateConversation}>
            <Plus size={18} strokeWidth={1.75} />
            New chat
          </button>
        </>
      }
    />

    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Conversations</h2>
        <span className="stat-card__meta">
          {conversations.length} {conversations.length === 1 ? 'thread' : 'threads'}
        </span>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <MessageSquare size={20} strokeWidth={1.75} />
          </div>
          <div className="empty-state__title">No conversations match that filter</div>
          <p className="empty-state__text">Start a new chat to ask a question about your documents.</p>
        </div>
      ) : (
        <div className="history-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className="history-row"
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span className="history-row__icon">
                <MessageSquare size={18} strokeWidth={1.75} />
              </span>
              <span className="history-row__main">
                <span className="history-row__title">{conversation.title}</span>
                <span className="history-row__subtitle">{conversation.subtitle}</span>
              </span>
              <span className="history-row__time">{conversation.updatedAt}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  </>
);
