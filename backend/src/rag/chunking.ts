export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
) {
  const chunks: string[] = [];
  const normalizedText = text.replace(/\s+/g, " ").trim();

  let index = 0;

  if (!normalizedText) {
    return chunks;
  }

  const step = Math.max(chunkSize - overlap, 1);

  while (index < normalizedText.length) {
    chunks.push(
      normalizedText.slice(index, index + chunkSize).trim()
    );

    index += step;
  }

  return chunks;
}