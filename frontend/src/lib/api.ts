import type { AuthResponse, RegisterResponse } from '../types/auth';

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

export async function uploadRequest(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ message: string; documentId: number; chunkCount: number }>('/api/rag/upload', {
    method: 'POST',
    token,
    body: formData,
  });
}
