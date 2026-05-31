import { useEffect, useState } from 'react';
import { ApiError, loginRequest, registerRequest } from '../lib/api';
import type { AuthSession, AuthUser } from '../types/auth';

const AUTH_STORAGE_KEY = 'rag-auth-session';

function loadStoredSession() {
  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession) as AuthSession;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(loadStoredSession());
    setIsReady(true);
  }, []);

  const setCurrentSession = (nextSession: AuthSession | null) => {
    setSession(nextSession);
    saveSession(nextSession);
  };

  const login = async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    const nextSession = { token: result.token, user: result.user } satisfies AuthSession;

    setCurrentSession(nextSession);
    return nextSession;
  };

  const register = async (email: string, password: string) => {
    return registerRequest(email, password);
  };

  const logout = () => {
    setCurrentSession(null);
  };

  const updateUser = (user: AuthUser) => {
    if (!session) {
      return;
    }

    setCurrentSession({
      token: session.token,
      user,
    });
  };

  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      logout();
    }
  };

  return {
    session,
    isReady,
    user: session?.user ?? null,
    token: session?.token ?? null,
    login,
    register,
    logout,
    updateUser,
    handleApiError,
  };
}
