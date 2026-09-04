import type { ReactNode } from 'react';
import { Composer } from '../components/Composer';
import { MessageList } from '../components/MessageList';
import type { ChatMessage } from '../types/chat';

interface ChatPageProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isSending: boolean;
  /** Conversation rail, rendered beside the stream in the admin shell. */
  rail?: ReactNode;
}

export const ChatPage = ({ messages, onSend, isSending, rail }: ChatPageProps) => (
  <div className="chat-workspace">
    {rail}

    <main className="chat">
      <section className="chat__stream">
        <div className="chat__surface">
          <MessageList messages={messages} />
        </div>
      </section>

      <footer className="chat__composer-wrap">
        <div className="chat__composer-inner">
          <Composer onSend={onSend} disabled={isSending} />
          <p className="chat__hint">Answers are generated only from the documents in this workspace.</p>
        </div>
      </footer>
    </main>
  </div>
);
