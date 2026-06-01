import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, askStreamRequest } from '../lib/api';
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
const STREAM_RENDER_INTERVAL_MS = 80;
const STREAM_CHUNK_SLICE_SIZE = 8;

type StreamState = {
  timerId: number | null;
  queue: string[];
  completed: boolean;
  targetConversationId: string;
  assistantPlaceholderId: string;
  resolveCompletion: (() => void) | null;
};

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

  const streamRef = useRef<StreamState>({
    timerId: null,
    queue: [],
    completed: false,
    targetConversationId: '',
    assistantPlaceholderId: '',
    resolveCompletion: null,
  });

  useEffect(() => {
    return () => {
      if (streamRef.current.timerId !== null) {
        window.clearTimeout(streamRef.current.timerId);
      }
    };
  }, []);

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

  const stopStreamTimer = () => {
    if (streamRef.current.timerId !== null) {
      window.clearTimeout(streamRef.current.timerId);
      streamRef.current.timerId = null;
    }
  };

  const finalizeStreamingMessage = () => {
    const { targetConversationId, assistantPlaceholderId } = streamRef.current;

    if (!targetConversationId || !assistantPlaceholderId) {
      streamRef.current.resolveCompletion?.();
      streamRef.current.resolveCompletion = null;
      return;
    }

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
                  isStreaming: false,
                  timestamp: formatTime(new Date()),
                }
              : message,
          ),
        };
      }),
    );

    streamRef.current.targetConversationId = '';
    streamRef.current.assistantPlaceholderId = '';
    streamRef.current.resolveCompletion?.();
    streamRef.current.resolveCompletion = null;
  };

  const pumpStreamQueue = () => {
    const state = streamRef.current;

    if (state.timerId !== null) {
      return;
    }

    const tick = () => {
      const nextChunk = state.queue.shift();

      if (!nextChunk) {
        state.timerId = null;

        if (state.completed) {
          finalizeStreamingMessage();
        }

        return;
      }

      const targetConversationId = state.targetConversationId;
      const assistantPlaceholderId = state.assistantPlaceholderId;

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
                    content: `${message.content}${nextChunk}`,
                  }
                : message,
            ),
          };
        }),
      );

      state.timerId = window.setTimeout(tick, STREAM_RENDER_INTERVAL_MS);
    };

    state.timerId = window.setTimeout(tick, STREAM_RENDER_INTERVAL_MS);
  };

  const queueStreamingChunk = (targetConversationId: string, assistantPlaceholderId: string, delta: string) => {
    const chunks: string[] = [];

    for (let index = 0; index < delta.length; index += STREAM_CHUNK_SLICE_SIZE) {
      chunks.push(delta.slice(index, index + STREAM_CHUNK_SLICE_SIZE));
    }

    streamRef.current.targetConversationId = targetConversationId;
    streamRef.current.assistantPlaceholderId = assistantPlaceholderId;
    streamRef.current.queue.push(...chunks.filter(Boolean));

    pumpStreamQueue();
  };

  const markStreamCompleted = () => {
    streamRef.current.completed = true;

    if (streamRef.current.timerId === null && streamRef.current.queue.length === 0) {
      finalizeStreamingMessage();
    }
  };

  const resetStreamState = () => {
    stopStreamTimer();
    streamRef.current.queue = [];
    streamRef.current.completed = false;
    streamRef.current.targetConversationId = '';
    streamRef.current.assistantPlaceholderId = '';
    streamRef.current.resolveCompletion = null;
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

    resetStreamState();
    streamRef.current.targetConversationId = targetConversationId;
    streamRef.current.assistantPlaceholderId = assistantPlaceholderId;

    const streamCompletion = new Promise<void>((resolve) => {
      streamRef.current.resolveCompletion = resolve;
    });

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
              content: '',
              isStreaming: true,
              timestamp: formatTime(new Date(now.getTime() + 30 * 1000)),
            },
          ],
        };
      }),
    );

    try {
      await askStreamRequest({
        token,
        question: trimmedContent,
        onChunk: (delta) => {
          queueStreamingChunk(targetConversationId, assistantPlaceholderId, delta);
        },
      });

      markStreamCompleted();
      await streamCompletion;
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Question failed. Please try again.';

      const resolveCompletion = streamRef.current.resolveCompletion;

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        onUnauthorized();
      }

      resetStreamState();
      resolveCompletion?.();

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
                    isStreaming: false,
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
