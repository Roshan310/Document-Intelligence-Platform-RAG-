import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  askStreamRequest,
  createChatConversationRequest,
  getChatConversationRequest,
  listChatConversationsRequest,
  type SaveChatResponse,
} from '../lib/api';
import type { AuthUser } from '../types/auth';
import type { ApiChatConversation, ApiChatMessage, ChatConversation, ChatMessage } from '../types/chat';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

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

function buildConversationTitle(message: string) {
  const trimmedMessage = message.trim();
  return trimmedMessage.slice(0, 32) || 'New chat';
}

function parseConversationId(conversationId: string) {
  const parsedId = Number(conversationId);
  return Number.isFinite(parsedId) ? parsedId : null;
}

function formatServerTimestamp(value: string | Date | null | undefined) {
  if (!value) {
    return 'Now';
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Now' : formatTime(date);
}

function mapApiMessage(message: ApiChatMessage): ChatMessage {
  return {
    id: String(message.id),
    role: message.role,
    content: message.content,
    timestamp: formatServerTimestamp(message.createdAt),
  };
}

function mapApiConversation(conversation: ApiChatConversation): ChatConversation {
  return {
    id: String(conversation.id),
    title: conversation.title || 'New chat',
    subtitle: conversation.subtitle || 'Fresh thread',
    updatedAt: formatServerTimestamp(conversation.updatedAt),
    tags: ['Workspace'],
    messages: (conversation.messages ?? []).map(mapApiMessage),
  };
}

export function useChat(
  user: AuthUser | null,
  token: string | null,
  onUnauthorized: () => void,
) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const onUnauthorizedRef = useRef(onUnauthorized);

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
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    if (!user || !token) {
      setConversations([]);
      setActiveConversationId('');
      return;
    }

    let isCancelled = false;

    const loadConversations = async () => {
      setIsLoadingConversations(true);

      try {
        const result = await listChatConversationsRequest(token);
        let loadedConversations = result.conversations;

        if (loadedConversations.length === 0) {
          const created = await createChatConversationRequest(token);
          loadedConversations = [created.conversation];
        }

        const firstConversation = loadedConversations[0];
        const firstConversationDetails = firstConversation
          ? await getChatConversationRequest(token, firstConversation.id)
          : null;

        if (isCancelled) {
          return;
        }

        const mappedConversations = loadedConversations.map(mapApiConversation);
        const mappedFirstConversation = firstConversationDetails
          ? mapApiConversation(firstConversationDetails.conversation)
          : null;

        setConversations(
          mappedConversations.map((conversation) =>
            mappedFirstConversation && conversation.id === mappedFirstConversation.id
              ? mappedFirstConversation
              : conversation,
          ),
        );
        setActiveConversationId(mappedFirstConversation?.id ?? mappedConversations[0]?.id ?? '');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setConversations([]);
        setActiveConversationId('');

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          onUnauthorizedRef.current();
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false);
        }
      }
    };

    void loadConversations();

    return () => {
      isCancelled = true;
    };
  }, [token, user]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);

    const serverConversationId = parseConversationId(conversationId);

    if (!token || serverConversationId === null) {
      return;
    }

    const loadConversation = async () => {
      try {
        const result = await getChatConversationRequest(token, serverConversationId);
        const loadedConversation = mapApiConversation(result.conversation);

        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === loadedConversation.id ? loadedConversation : conversation,
          ),
        );
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          onUnauthorized();
        }
      }
    };

    void loadConversation();
  };

  const createNewConversation = async () => {
    if (!token || !user) {
      return;
    }

    try {
      const result = await createChatConversationRequest(token);
      const conversation = mapApiConversation(result.conversation);

      setConversations((previous) => [conversation, ...previous]);
      setActiveConversationId(conversation.id);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        onUnauthorized();
      }
    }
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

  const applySavedChat = (
    savedChat: SaveChatResponse,
    targetConversationId: string,
    userMessageId: string,
    assistantPlaceholderId: string,
  ) => {
    const savedConversation = mapApiConversation(savedChat.conversation);
    const savedUserMessage = savedChat.messages.find((message) => message.role === 'user');
    const savedAssistantMessage = savedChat.messages.find((message) => message.role === 'assistant');

    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== targetConversationId) {
          return conversation;
        }

        return {
          ...conversation,
          title: savedConversation.title,
          subtitle: savedConversation.subtitle,
          updatedAt: savedConversation.updatedAt,
          tags: savedConversation.tags,
          messages: conversation.messages.map((message) => {
            if (savedUserMessage && message.id === userMessageId) {
              return mapApiMessage(savedUserMessage);
            }

            if (savedAssistantMessage && message.id === assistantPlaceholderId) {
              return {
                ...mapApiMessage(savedAssistantMessage),
                isStreaming: false,
              };
            }

            return message;
          }),
        };
      }),
    );
  };

  const ensureActiveConversation = async () => {
    if (activeConversationId) {
      return activeConversationId;
    }

    if (!token || !user) {
      return '';
    }

    const result = await createChatConversationRequest(token);
    const conversation = mapApiConversation(result.conversation);

    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);

    return conversation.id;
  };

  const sendMessage = async (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent || !token || !user || isSending || isLoadingConversations) {
      return;
    }

    const ensuredConversationId = await ensureActiveConversation();
    const targetConversationId = ensuredConversationId || activeConversationId;
    const serverConversationId = parseConversationId(targetConversationId);

    if (serverConversationId === null) {
      return;
    }

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
      let savedChat: SaveChatResponse | null = null;

      await askStreamRequest({
        token,
        question: trimmedContent,
        conversationId: serverConversationId,
        onChunk: (delta) => {
          queueStreamingChunk(targetConversationId, assistantPlaceholderId, delta);
        },
        onSaved: (nextSavedChat) => {
          savedChat = nextSavedChat;
        },
      });

      markStreamCompleted();
      await streamCompletion;

      if (savedChat) {
        applySavedChat(savedChat, targetConversationId, userMessage.id, assistantPlaceholderId);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error && error.message.trim()
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
