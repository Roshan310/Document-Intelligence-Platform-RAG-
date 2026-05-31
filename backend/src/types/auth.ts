export type AuthRole = "admin" | "user";

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
  isBlocked: boolean;
  avatarUrl: string;
};

export type JwtUser = {
  id: number;
  role: AuthRole;
};