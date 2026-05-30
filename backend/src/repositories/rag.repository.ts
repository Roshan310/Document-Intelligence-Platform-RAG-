import { sequelize } from "../config/database";
import { formatEmbedding } from "../rag/embedding";

export async function searchSimilarChunks(
  embedding: number[],
  filters: { userId: number; documentId?: number }
) {
  const vector = formatEmbedding(embedding);

  const replacements: Record<string, number | string | null> = {
    vector,
    userId: filters.userId,
    documentId: filters.documentId ?? null,
  };

  const [results] = await sequelize.query(`
    SELECT c.content, c."documentId", d.filename
    FROM chunks c
    INNER JOIN documents d ON d.id = c."documentId"
    WHERE d."userId" = :userId
      AND (:documentId IS NULL OR d.id = :documentId)
    ORDER BY c.embedding <=> :vector::vector
    LIMIT 5
  `, {
    replacements,
  });

  return results;
}

