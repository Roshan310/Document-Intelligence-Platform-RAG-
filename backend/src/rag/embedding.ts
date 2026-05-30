import { ai } from "../config/gemini";

export type EmbeddingKind = "query" | "document";

function prepareEmbeddingText(text: string, kind: EmbeddingKind) {
  if (kind === "document") {
    return `title: none | text: ${text}`;
  }

  return `task: search result | query: ${text}`;
}

export async function createEmbedding(
  text: string,
  kind: EmbeddingKind = "query"
) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: prepareEmbeddingText(text, kind),
    config: {
      outputDimensionality: 1536,
    },
  });

  return response.embeddings?.[0].values || [];
}

export function formatEmbedding(values: number[]) {
  return `[${values.join(",")}]`;
}