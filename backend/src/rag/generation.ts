import { ai } from "../config/gemini";

const MODEL_NAME = "gemini-2.5-flash";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const buildAnswerPrompt = (
  question: string,
  context: string
) => `
You are a helpful assistant.

Answer ONLY using the provided context. If the answer is not in the context, say you do not know.

Context:
${context}

Question:
${question}
`;

export async function generateAnswer(
  question: string,
  context: string
) {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: buildAnswerPrompt(question, context),
  });

  return response.text ?? "";
}

export async function generateAnswerStream(
  question: string,
  context: string
) {
  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: buildAnswerPrompt(question, context),
  });

  return (async function* () {
    let accumulatedText = "";

    for await (const chunk of responseStream) {
      const text = chunk.text ?? "";

      if (text) {
        const delta = text.startsWith(accumulatedText)
          ? text.slice(accumulatedText.length)
          : text;

        accumulatedText = text;

        if (delta) {
          const maxSliceSize = 12;

          for (let index = 0; index < delta.length; index += maxSliceSize) {
            yield delta.slice(index, index + maxSliceSize);
            await sleep(12);
          }
        }
      }
    }
  })();
}