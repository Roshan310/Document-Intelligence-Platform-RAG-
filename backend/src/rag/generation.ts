import { ai } from "../config/gemini";

export async function generateAnswer(
  question: string,
  context: string
) {
  const prompt = `
You are a helpful assistant.

Answer ONLY using the provided context. If the answer is not in the context, say you do not know.

Context:
${context}

Question:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}