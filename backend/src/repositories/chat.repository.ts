import { Transaction } from "sequelize";
import { sequelize } from "../config/database";
import { ChatConversation } from "../models/chat-conversation.model";
import { ChatMessage, ChatMessageRole } from "../models/chat-message.model";

export type CreateChatMessageInput = {
  role: ChatMessageRole;
  content: string;
};

export const findUserConversations = async (userId: number) => {
  return ChatConversation.findAll({
    where: { userId },
    order: [["updatedAt", "DESC"]],
  });
};

export const findUserConversationById = async (
  userId: number,
  conversationId: number
) => {
  return ChatConversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });
};

export const findMessagesByConversationId = async (
  conversationId: number
) => {
  return ChatMessage.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
};

export const createConversation = async (
  userId: number,
  values: {
    title?: string;
    subtitle?: string | null;
    documentId?: number | null;
  } = {},
  transaction?: Transaction
) => {
  return ChatConversation.create(
    {
      userId,
      title: values.title ?? "New chat",
      subtitle: values.subtitle ?? null,
      documentId: values.documentId ?? null,
    },
    { transaction }
  );
};

export const createMessages = async (
  conversationId: number,
  messages: CreateChatMessageInput[],
  transaction?: Transaction
) => {
  return ChatMessage.bulkCreate(
    messages.map((message) => ({
      conversationId,
      ...message,
    })),
    { transaction, returning: true }
  );
};

export const touchConversation = async (
  conversation: ChatConversation,
  values: {
    title?: string;
    subtitle?: string | null;
    documentId?: number | null;
  },
  transaction?: Transaction
) => {
  await conversation.update(values, { transaction });
  return conversation;
};

export const appendConversationMessages = async (
  userId: number,
  input: {
    conversationId?: number;
    title: string;
    subtitle: string;
    documentId?: number | null;
    messages: CreateChatMessageInput[];
  }
) => {
  return sequelize.transaction(async (transaction) => {
    const conversation = input.conversationId
      ? await findUserConversationById(userId, input.conversationId)
      : await createConversation(
          userId,
          {
            title: input.title,
            subtitle: input.subtitle,
            documentId: input.documentId ?? null,
          },
          transaction
        );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await touchConversation(
      conversation,
      {
        title: conversation.title === "New chat" ? input.title : conversation.title,
        subtitle: input.subtitle,
        documentId: input.documentId ?? conversation.documentId,
      },
      transaction
    );

    const messages = await createMessages(
      conversation.id,
      input.messages,
      transaction
    );

    return {
      conversation,
      messages,
    };
  });
};

export const deleteUserConversation = async (
  userId: number,
  conversationId: number
) => {
  return sequelize.transaction(async (transaction) => {
    const conversation = await findUserConversationById(userId, conversationId);

    if (!conversation) {
      return null;
    }

    await ChatMessage.destroy({
      where: { conversationId },
      transaction,
    });

    await conversation.destroy({ transaction });

    return conversation;
  });
};
