import { ai } from "../config/gemini";

const MODEL_NAME = "gemini-2.5-flash";
// const MODEL_NAME = "gemini-2.5-flash";
const GEMINI_LIMIT_MESSAGE =
  "The Gemini service limit was reached. Please try again later.";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractReadableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

function isGeminiLimitError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("resource exhausted") ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("limit exceeded") ||
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("exceeded your current quota")
  );
}

function toFriendlyGeminiError(error: unknown) {
  const message = extractReadableErrorMessage(error);

  if (message.trim().startsWith("{")) {
    try {
      const payload = JSON.parse(message) as {
        error?: {
          message?: string;
          code?: number;
        };
        message?: string;
      };

      const nestedMessage = payload.error?.message ?? payload.message ?? message;

      if (
        payload.error?.code === 429 ||
        isGeminiLimitError(nestedMessage)
      ) {
        return new Error(GEMINI_LIMIT_MESSAGE);
      }

      return new Error(nestedMessage);
    } catch {
      // Fall through to the generic mapping below.
    }
  }

  if (isGeminiLimitError(message)) {
    return new Error(GEMINI_LIMIT_MESSAGE);
  }

  return new Error(message || "Question failed");
}

export const buildAnswerPrompt = (
  question: string,
  context: string
) => `
You are a helpful assistant.

Answer ONLY using the provided context. If the answer is not in the context, say you do not know.

Format the answer with Markdown. For mathematical notation, use LaTeX with $...$ for inline math
and $$...$$ on separate lines for display math. Escape literal currency dollar signs as \\$.

Context:
${context}

Question:
${question}
`;

//this is a normal function which returns the full answer at once
export async function generateAnswer(
  question: string,
  context: string
) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildAnswerPrompt(question, context),
    });

    return response.text ?? "";
  } catch (error) {
    throw toFriendlyGeminiError(error);
  }
}

// this will return answer as stream
export async function generateAnswerStream(
  question: string,
  context: string
) {
  let responseStream;

  try {
    responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: buildAnswerPrompt(question, context),
    });
  } catch (error) {
    throw toFriendlyGeminiError(error);
  }

  return (async function* () {
    let accumulatedText = "";

    try {
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
    } catch (error) {
      throw toFriendlyGeminiError(error);
    }
  })();
}