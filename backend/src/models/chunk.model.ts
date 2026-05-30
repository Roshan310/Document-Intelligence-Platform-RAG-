import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../config/database";

export class Chunk extends Model<
  InferAttributes<Chunk>,
  InferCreationAttributes<Chunk>
> {
  declare content: string;
  declare embedding: string;
  declare documentId: number;
}

Chunk.init(
  {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    embedding: {
      type: DataTypes.TEXT,
      allowNull: false,
      set(value: number[] | string) {
        if (Array.isArray(value)) {
          this.setDataValue(
            "embedding",
            `[${value.join(",")}]`
          );
          return;
        }

        this.setDataValue("embedding", value);
      },
    },

    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Chunk",
    tableName: "chunks",
  }
);