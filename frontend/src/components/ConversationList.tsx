import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import type { ChatConversation } from '../types/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  deletingConversationId: string | null;
  deleteError: string | null;
  isSending: boolean;
  variant: 'dark' | 'light';
  emptyMessage: string;
}

export const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  deletingConversationId,
  deleteError,
  isSending,
  variant,
  emptyMessage,
}: ConversationListProps) => {
  return (
    <div className={`conversation-list conversation-list--${variant}`}>
      {deleteError ? (
        <div className="conversation-list__error" role="alert">
          {deleteError}
        </div>
      ) : null}

      {conversations.length === 0 ? (
        <div className="conversation-list__empty">{emptyMessage}</div>
      ) : (
        conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;

          return (
            <div
              key={conversation.id}
              className={`conversation-item${isActive ? ' conversation-item--active' : ''}`}
            >
              <button
                type="button"
                className="conversation-item__select"
                onClick={() => onSelectConversation(conversation.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <MessageSquare size={14} strokeWidth={1.75} className="conversation-item__icon" />
                <span className="conversation-item__body">
                  <span className="conversation-item__title">{conversation.title}</span>
                </span>
                <span className="conversation-item__time">{conversation.updatedAt}</span>
              </button>

              <button
                type="button"
                className="conversation-item__delete"
                onClick={() => onDeleteConversation(conversation.id)}
                disabled={
                  deletingConversationId !== null ||
                  (isSending && conversation.id === activeConversationId)
                }
                aria-label={`Delete ${conversation.title}`}
                title={
                  isSending && isActive
                    ? 'Wait for the response to finish'
                    : 'Delete conversation'
                }
              >
                {deletingConversationId === conversation.id ? (
                  <Loader2 size={14} strokeWidth={1.75} className="spinner" />
                ) : (
                  <Trash2 size={14} strokeWidth={1.75} />
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};
