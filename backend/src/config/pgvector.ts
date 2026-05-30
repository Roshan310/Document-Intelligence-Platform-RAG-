import { sequelize } from "./database";

const EMBEDDING_DIMENSION = 1536;

export async function ensurePgVectorSchema() {
  await sequelize.query("CREATE EXTENSION IF NOT EXISTS vector");

  await sequelize.query(`
    ALTER TABLE IF EXISTS "chunks"
    ALTER COLUMN "embedding"
    TYPE vector(${EMBEDDING_DIMENSION})
    USING "embedding"::vector
  `);
}