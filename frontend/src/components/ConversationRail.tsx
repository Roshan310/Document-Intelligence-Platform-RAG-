import { Plus, Search } from 'lucide-react';
import type { ChatConversation } from '../types/chat';
import { ConversationList } from './ConversationList';

interface ConversationRailProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
}

export const ConversationRail = ({
  conversations,
  activeConversationId,
  searchTerm,
  onSearchTermChange,
  onSelectConversation,
  onCreateConversation,
}: ConversationRailProps) => (
  <aside className="chat-rail">
    <button className="btn btn--primary btn--block" type="button" onClick={onCreateConversation}>
      <Plus size={18} strokeWidth={1.75} />
      New chat
    </button>

    <label className="search-field">
      <span className="sr-only">Search conversations</span>
      <span className="search-field__icon" aria-hidden="true">
        <Search size={16} strokeWidth={1.75} />
      </span>
      <input
        className="input"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        type="search"
        placeholder="Search conversations"
        aria-label="Search conversations"
      />
    </label>

    <ConversationList
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={onSelectConversation}
      variant="light"
      emptyMessage="No conversations match that filter."
    />
  </aside>
);
