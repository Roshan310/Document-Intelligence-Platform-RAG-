export type AuthRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  email: string;
  role: AuthRole;
  isBlocked: boolean;
  avatarUrl: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterResponse extends AuthResponse {
  verificationRequired: boolean;
  verificationEmailSent: boolean;
}
