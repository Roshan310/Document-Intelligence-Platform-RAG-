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

    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession> | null;

    if (!parsedSession || typeof parsedSession !== 'object') {
      return null;
    }

    const user = parsedSession.user;

    if (!user || typeof user !== 'object') {
      return null;
    }

    const normalizedUser: AuthUser = {
      id: typeof user.id === 'number' ? user.id : 0,
      email: typeof user.email === 'string' ? user.email : '',
      role: user.role === 'admin' ? 'admin' : 'user',
      isBlocked: Boolean(user.isBlocked),
      avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
    };

    if (!parsedSession.token || typeof parsedSession.token !== 'string' || !normalizedUser.email || !normalizedUser.id) {
      return null;
    }

    return {
      token: parsedSession.token,
      user: normalizedUser,
    } satisfies AuthSession;
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
