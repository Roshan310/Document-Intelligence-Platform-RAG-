import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../config/database";

export class ChatConversation extends Model<
  InferAttributes<ChatConversation>,
  InferCreationAttributes<ChatConversation>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare title: CreationOptional<string>;
  declare subtitle: CreationOptional<string | null>;
  declare documentId: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ChatConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: "New chat",
    },
    subtitle: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "ChatConversation",
    tableName: "chat_conversations",
  }
);
