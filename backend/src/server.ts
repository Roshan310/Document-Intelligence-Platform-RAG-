import dotenv from "dotenv";

dotenv.config();

import app from "./app";

import { sequelize } from "./config/database";
import { ensurePgVectorSchema } from "./config/pgvector";

import "./models/document.model";
import "./models/chunk.model";

async function start() {
  try {
    await sequelize.authenticate();

    console.log("Database connected");

    await sequelize.sync();

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