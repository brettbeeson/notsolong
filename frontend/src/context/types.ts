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
    display_name?: string;
    turnstileToken?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (
    payload: Partial<Pick<User, "display_name" | "email">>
  ) => Promise<void>;
}
