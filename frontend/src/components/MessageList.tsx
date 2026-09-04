import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
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
        <div className="empty-state">
          <div className="empty-state__icon">
            <MessagesSquare size={20} strokeWidth={1.75} />
          </div>
          <div className="empty-state__title">Ask anything about your documents</div>
          <p className="empty-state__text">
            Start a conversation by asking a question about the uploaded documents.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <article
            key={message.id}
            className={`message-row message-row--${message.role}`}
            aria-label={`${message.role} message`}
          >
            <div className={`message-row__bubble${message.isStreaming ? ' message-row__bubble--streaming' : ''}`}>
              {message.isStreaming && !message.content ? (
                <span className="typing-indicator" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                message.role === 'assistant'
                  ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )
                  : message.content
              )}
            </div>
            <div className="message-row__time">{message.timestamp}</div>
          </article>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
};
