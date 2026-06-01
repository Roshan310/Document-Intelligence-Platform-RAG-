import type { AuthResponse, RegisterResponse } from '../types/auth';
import type { ListDocumentsResponse } from '../types/document';

const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null;
  token?: string | null;
}

interface AskStreamOptions {
  token: string;
  question: string;
  documentId?: number;
  onChunk: (delta: string) => void;
  onStart?: () => void;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return typeof payload?.message === 'string' ? payload.message : 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function registerRequest(email: string, password: string) {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export async function askRequest(token: string, question: string) {
  return apiRequest<{ answer: string }>('/api/rag/ask', {
    method: 'POST',
    token,
    body: { question },
  });
}

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent.split(/\r?\n/);
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return {
    eventName,
    data: dataLines.join('\n'),
  };
}

function findSseEventBoundary(buffer: string) {
  const crlfBoundary = buffer.indexOf('\r\n\r\n');
  const lfBoundary = buffer.indexOf('\n\n');

  if (crlfBoundary === -1) {
    return lfBoundary;
  }

  if (lfBoundary === -1) {
    return crlfBoundary;
  }

  return Math.min(crlfBoundary, lfBoundary);
}

function decodeSsePayload(payload: string) {
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function askStreamRequest({
  token,
  question,
  documentId,
  onChunk,
  onStart,
}: AskStreamOptions) {
  const response = await fetch(`${apiBaseUrl}/api/rag/ask/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      documentId,
    }),
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (!response.body) {
    throw new Error('Streaming response is not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalText = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = findSseEventBoundary(buffer);

      while (separatorIndex !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex).trim();
        const separatorSize = buffer.startsWith('\r\n\r\n', separatorIndex) ? 4 : 2;

        buffer = buffer.slice(separatorIndex + separatorSize);
        separatorIndex = findSseEventBoundary(buffer);

        if (!rawEvent) {
          continue;
        }

        const { eventName, data } = parseSseEvent(rawEvent);
        const payload = decodeSsePayload(data);

        if (eventName === 'start') {
          onStart?.();
          continue;
        }

        if (eventName === 'chunk') {
          const delta = typeof payload?.delta === 'string' ? payload.delta : '';

          if (delta) {
            finalText += delta;
            onChunk(delta);
          }
          continue;
        }

        if (eventName === 'error') {
          const message = typeof payload?.message === 'string' ? payload.message : 'Question failed';
          throw new Error(message);
        }

        if (eventName === 'done') {
          break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return finalText;
}

export async function uploadRequest(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ message: string; documentId: number; chunkCount: number }>('/api/rag/upload', {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function listUploadedDocumentsRequest(token: string) {
  return apiRequest<ListDocumentsResponse>('/api/rag/documents', {
    method: 'GET',
    token,
  });
}
