export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  tags: string[];
  messages: ChatMessage[];
}