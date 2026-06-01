import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="sidebar__empty">Start a conversation by asking a question about the uploaded documents.</div>
      ) : (
        messages.map((message) => (
          <article
            key={message.id}
            className={`message-row message-row--${message.role}`}
            aria-label={`${message.role} message`}
          >
            <div className="message-row__avatar">{message.role === 'assistant' ? 'R' : 'You'}</div>
            <div className="message-row__content">
              <div className={`message-row__bubble${message.isStreaming ? ' message-row__bubble--streaming' : ''}`}>
                {message.isStreaming && !message.content ? (
                  <span className="typing-indicator" aria-label="Assistant is typing">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  message.content
                )}
              </div>
              <div className="message-row__time">{message.timestamp}</div>
            </div>
          </article>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
};