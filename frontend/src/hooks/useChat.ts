import { useEffect, useMemo, useState } from 'react';
import { ApiError, askRequest } from '../lib/api';
import type { AuthUser } from '../types/auth';
import type { ChatConversation, ChatMessage } from '../types/chat';

const DEFAULT_WELCOME_MESSAGE =
  'You are now chatting inside the RAG workspace. Ask a question about the uploaded documents.';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

const conversationStorageKey = (userId: number) => `rag-conversations:${userId}`;

const createStarterConversation = (): ChatConversation => ({
  id: createId(),
  title: 'New chat',
  subtitle: 'Fresh thread',
  updatedAt: 'Now',
  tags: ['Workspace'],
  messages: [
    {
      id: createId(),
      role: 'assistant',
      content: DEFAULT_WELCOME_MESSAGE,
      timestamp: 'Now',
    },
  ],
});

function loadConversations(userId: number) {
  try {
    const rawValue = localStorage.getItem(conversationStorageKey(userId));

    if (!rawValue) {
      return [createStarterConversation()];
    }

    const parsed = JSON.parse(rawValue) as ChatConversation[];
    return parsed.length > 0 ? parsed : [createStarterConversation()];
  } catch {
    return [createStarterConversation()];
  }
}

function saveConversations(userId: number, conversations: ChatConversation[]) {
  localStorage.setItem(conversationStorageKey(userId), JSON.stringify(conversations));
}

function buildConversationTitle(message: string) {
  const trimmedMessage = message.trim();
  return trimmedMessage.slice(0, 32) || 'New chat';
}

export function useChat(
  user: AuthUser | null,
  token: string | null,
  onUnauthorized: () => void,
) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationId('');
      return;
    }

    const loadedConversations = loadConversations(user.id);
    setConversations(loadedConversations);
    setActiveConversationId(loadedConversations[0]?.id ?? '');
  }, [user]);

  useEffect(() => {
    if (!user || conversations.length === 0) {
      return;
    }

    saveConversations(user.id, conversations);
  }, [conversations, user]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const createNewConversation = () => {
    const conversation = createStarterConversation();
    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);
  };

  const sendMessage = async (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent || !activeConversationId || !token || !user || isSending) {
      return;
    }

    const targetConversationId = activeConversationId;

    const now = new Date();
    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmedContent,
      timestamp: formatTime(now),
    };

    const assistantPlaceholderId = createId();

    setIsSending(true);
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== targetConversationId) {
          return conversation;
        }

        const isStarterThread = conversation.title === 'New chat';

        return {
          ...conversation,
          title: isStarterThread ? buildConversationTitle(trimmedContent) : conversation.title,
          subtitle: trimmedContent.slice(0, 64),
          updatedAt: 'Now',
          messages: [
            ...conversation.messages,
            userMessage,
            {
              id: assistantPlaceholderId,
              role: 'assistant',
              content: 'Thinking...',
              timestamp: formatTime(new Date(now.getTime() + 30 * 1000)),
            },
          ],
        };
      }),
    );

    try {
      const result = await askRequest(token, trimmedContent);

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== targetConversationId) {
            return conversation;
          }

          return {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === assistantPlaceholderId
                ? {
                    ...message,
                    content: result.answer,
                    timestamp: formatTime(new Date(now.getTime() + 60 * 1000)),
                  }
                : message,
            ),
          };
        }),
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Question failed. Please try again.';

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        onUnauthorized();
      }

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== targetConversationId) {
            return conversation;
          }

          return {
            ...conversation,
            messages: conversation.messages.map((messageItem) =>
              messageItem.id === assistantPlaceholderId
                ? {
                    ...messageItem,
                    content: message,
                  }
                : messageItem,
            ),
          };
        }),
      );
    } finally {
      setIsSending(false);
    }
  };

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isSending,
    selectConversation,
    createNewConversation,
    sendMessage,
  };
}
