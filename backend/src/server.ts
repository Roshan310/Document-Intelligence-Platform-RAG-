import dotenv from "dotenv";

dotenv.config();

import app from "./app";

import { sequelize } from "./config/database";
import { ensurePgVectorSchema } from "./config/pgvector";
import { User } from "./models/user.model";

import "./models/document.model";
import "./models/chunk.model";
import "./models/user.model";
import "./models/chat-conversation.model";
import "./models/chat-message.model";

async function start() {
  try {
    await sequelize.authenticate();

    console.log("Database connected");

    await sequelize.sync();

    await User.sync({ alter: true });

    console.log("Database synced");

    await ensurePgVectorSchema();

    console.log("pgvector schema ready");

    app.listen(process.env.PORT, () => {
      console.log(
        `Server running on port ${process.env.PORT}`
      );
    });
  } catch (error) {
    console.log(error);
  }
}

start();
