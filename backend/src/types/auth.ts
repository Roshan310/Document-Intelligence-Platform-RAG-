export type AuthRole = "admin" | "user";

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
  avatarUrl: string;
};

export type JwtUser = {
  id: number;
  role: AuthRole;
};