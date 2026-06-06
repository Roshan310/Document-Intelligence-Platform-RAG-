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

export interface ApiChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiChatConversation {
  id: number;
  title: string;
  subtitle: string | null;
  documentId: number | null;
  createdAt: string;
  updatedAt: string;
  messages: ApiChatMessage[];
}
