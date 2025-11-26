import { useCallback, useEffect, useMemo, useState } from "react";

import { setAuthToken } from "../api/client";
import {
  fetchCurrentUser,
  login as loginRequest,
  refreshToken,
  register as registerRequest,
  updateCurrentUser,
} from "../api/endpoints";
import type { RegisterResponse, Tokens, User } from "../types/api";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./types";

const STORAGE_KEY = "notsolong-auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);

  const persistTokens = useCallback((next: Tokens | null) => {
    setTokens(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setAuthToken(next.access);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
  }, []);

  const hydrate = useCallback(async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed: Tokens = JSON.parse(stored);
      persistTokens(parsed);
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      console.warn("Failed to hydrate session", error);
      persistTokens(null);
    } finally {
      setLoading(false);
    }
  }, [persistTokens]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const authTokens = await loginRequest(payload);
      persistTokens(authTokens);
      const profile = await fetchCurrentUser();
      setUser(profile);
    },
    [persistTokens]
  );

  const register = useCallback(
    async (payload: { email: string; password: string; display_name?: string }) => {
      const response: RegisterResponse = await registerRequest(payload);
      persistTokens(response.tokens);
      setUser(response.user);
    },
    [persistTokens]
  );

  const logout = useCallback(() => {
    persistTokens(null);
    setUser(null);
  }, [persistTokens]);

  const updateProfile = useCallback(
    async (payload: Partial<Pick<User, "display_name" | "email">>) => {
      if (!tokens) return;
      const updated = await updateCurrentUser(payload);
      setUser(updated);
    },
    [tokens]
  );

  useEffect(() => {
    let timer: number | undefined;
    if (tokens?.refresh) {
      timer = window.setInterval(async () => {
        try {
          const { access } = await refreshToken(tokens.refresh);
          const nextTokens = { ...tokens, access };
          persistTokens(nextTokens);
        } catch (error) {
          console.warn("Token refresh failed", error);
          logout();
        }
      }, 1000 * 60 * 10);
    }
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [tokens, persistTokens, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, tokens, loading, login, register, logout, updateProfile }),
    [user, tokens, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
