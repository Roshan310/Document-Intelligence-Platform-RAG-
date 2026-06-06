import { ChatConversation } from "../models/chat-conversation.model";
import { ChatMessage } from "../models/chat-message.model";
import * as chatRepo from "../repositories/chat.repository";

const DEFAULT_CHAT_TITLE = "New chat";

function buildConversationTitle(question: string) {
  const trimmedQuestion = question.trim();
  return trimmedQuestion.slice(0, 64) || DEFAULT_CHAT_TITLE;
}

function buildConversationSubtitle(question: string) {
  return question.trim().slice(0, 128);
}

export function serializeChatMessage(message: ChatMessage) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export async function serializeConversation(
  conversation: ChatConversation,
  options: { includeMessages?: boolean } = {}
) {
  const messages = options.includeMessages
    ? await chatRepo.findMessagesByConversationId(conversation.id)
    : [];

  return {
    id: conversation.id,
    title: conversation.title,
    subtitle: conversation.subtitle,
    documentId: conversation.documentId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: messages.map(serializeChatMessage),
  };
}

export async function listConversations(userId: number) {
  const conversations = await chatRepo.findUserConversations(userId);
  return Promise.all(
    conversations.map((conversation) => serializeConversation(conversation))
  );
}

export async function getConversation(
  userId: number,
  conversationId: number
) {
  const conversation = await chatRepo.findUserConversationById(
    userId,
    conversationId
  );

  if (!conversation) {
    return null;
  }

  return serializeConversation(conversation, {
    includeMessages: true,
  });
}

export async function createEmptyConversation(
  userId: number,
  input: {
    title?: string;
    subtitle?: string | null;
    documentId?: number | null;
  }
) {
  const conversation = await chatRepo.createConversation(userId, input);
  return serializeConversation(conversation, {
    includeMessages: true,
  });
}

export async function deleteConversation(
  userId: number,
  conversationId: number
) {
  return chatRepo.deleteUserConversation(userId, conversationId);
}

export async function ensureConversationAccess(
  userId: number,
  conversationId?: number
) {
  if (!conversationId) {
    return;
  }

  const conversation = await chatRepo.findUserConversationById(
    userId,
    conversationId
  );

  if (!conversation) {
    throw new Error("Conversation not found");
  }
}

export async function saveQuestionAnswer(
  userId: number,
  input: {
    conversationId?: number;
    question: string;
    answer: string;
    documentId?: number | null;
  }
) {
  const result = await chatRepo.appendConversationMessages(userId, {
    conversationId: input.conversationId,
    title: buildConversationTitle(input.question),
    subtitle: buildConversationSubtitle(input.question),
    documentId: input.documentId ?? null,
    messages: [
      {
        role: "user",
        content: input.question,
      },
      {
        role: "assistant",
        content: input.answer,
      },
    ],
  });

  return {
    conversation: await serializeConversation(result.conversation),
    messages: result.messages.map(serializeChatMessage),
  };
}
