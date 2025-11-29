import { useCallback, useEffect, useMemo, useState } from "react";

import { setAuthToken } from "../api/client";
import {
  confirmPasswordReset as confirmPasswordResetRequest,
  fetchCurrentUser,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logout as logoutRequest,
  refreshToken,
  register as registerRequest,
  requestPasswordReset as requestPasswordResetRequest,
  updateCurrentUser,
} from "../api/endpoints";
import type { AuthSession, Tokens, User } from "../types/api";
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

  const applySession = useCallback(
    ({ user: nextUser, tokens: nextTokens }: AuthSession) => {
      persistTokens(nextTokens);
      setUser(nextUser);
    },
    [persistTokens]
  );

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      console.warn("Failed to refresh profile", error);
    }
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string; turnstileToken?: string }) => {
      const session = await loginRequest({
        email: payload.email,
        password: payload.password,
        turnstile_token: payload.turnstileToken,
      });
      applySession(session);
      await refreshProfile();
    },
    [applySession, refreshProfile]
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      username?: string;
      turnstileToken?: string;
    }) => {
      const response: AuthSession = await registerRequest({
        email: payload.email,
        password: payload.password,
        username: payload.username,
        turnstile_token: payload.turnstileToken,
      });
      applySession(response);
      await refreshProfile();
    },
    [applySession, refreshProfile]
  );

  const logout = useCallback(async () => {
    const refreshValue = tokens?.refresh;
    persistTokens(null);
    setUser(null);
    if (refreshValue) {
      try {
        await logoutRequest(refreshValue);
      } catch (error) {
        console.warn("Failed to revoke refresh token", error);
      }
    }
  }, [persistTokens, tokens]);

  const updateProfile = useCallback(
    async (payload: Partial<Pick<User, "username" | "email">>) => {
      if (!tokens) return;
      const updated = await updateCurrentUser(payload);
      setUser(updated);
    },
    [tokens]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await requestPasswordResetRequest(email);
  }, []);

  const completePasswordReset = useCallback(
    async (payload: { uid: string; token: string; newPassword: string; confirmPassword: string }) => {
      await confirmPasswordResetRequest({
        uid: payload.uid,
        token: payload.token,
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      });
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (accessToken: string) => {
      const session = await loginWithGoogleRequest(accessToken);
      applySession(session);
      await refreshProfile();
    },
    [applySession, refreshProfile]
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
    () => ({
      user,
      tokens,
      loading,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
      requestPasswordReset,
      completePasswordReset,
      loginWithGoogle,
    }),
    [
      user,
      tokens,
      loading,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
      requestPasswordReset,
      completePasswordReset,
      loginWithGoogle,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
