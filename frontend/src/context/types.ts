import type { Tokens, User } from "../types/api";

export interface AuthContextValue {
  user: User | null;
  tokens: Tokens | null;
  loading: boolean;
  login: (payload: {
    email: string;
    password: string;
    turnstileToken?: string;
  }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    username?: string;
    turnstileToken?: string;
  }) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    payload: Partial<Pick<User, "username" | "email">>
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (payload: {
    uid: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
}
