import { MessageSquare } from 'lucide-react';
import type { ChatConversation } from '../types/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  variant: 'dark' | 'light';
  emptyMessage: string;
}

export const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  variant,
  emptyMessage,
}: ConversationListProps) => {
  return (
    <div className={`conversation-list conversation-list--${variant}`}>
      {conversations.length === 0 ? (
        <div className="conversation-list__empty">{emptyMessage}</div>
      ) : (
        conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;

          return (
            <button
              key={conversation.id}
              type="button"
              className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
              aria-current={isActive ? 'true' : undefined}
            >
              <MessageSquare size={14} strokeWidth={1.75} className="conversation-item__icon" />
              <span className="conversation-item__body">
                <span className="conversation-item__title">{conversation.title}</span>
              </span>
              <span className="conversation-item__time">{conversation.updatedAt}</span>
            </button>
          );
        })
      )}
    </div>
  );
};
