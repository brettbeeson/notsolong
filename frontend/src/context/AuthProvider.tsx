import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";

import { setAuthToken } from "../api/client";
import { clearStoredTokens, getStoredTokens, setStoredTokens } from "../auth/storage";
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

// Enable extra auth diagnostics in dev, or by setting VITE_AUTH_DEBUG=true.
// This keeps production console noise low while still allowing troubleshooting.
const AUTH_DEBUG = true; //import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === "true";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);

  const persistTokens = useCallback((next: Tokens | null) => {
    setTokens(next);
    if (next) {
      setStoredTokens(next);
      setAuthToken(next.access);
    } else {
      clearStoredTokens();
      setAuthToken(null);
    }
  }, []);

  const hydrate = useCallback(async () => {
    // Hydration restores tokens from localStorage so users stay logged in across reloads.
    // If the access token expired (common after tab closure), we attempt to refresh it
    // using the long-lived refresh token before clearing the session.
    if (AUTH_DEBUG) console.debug("[auth] hydrate: start");
    const parsed = getStoredTokens();
    if (!parsed) {
      if (AUTH_DEBUG) console.debug("[auth] hydrate: no stored tokens");
      setLoading(false);
      return;
    }
    try {
      if (AUTH_DEBUG) console.debug("[auth] hydrate: found stored tokens");
      persistTokens(parsed);
      try {
        const profile = await fetchCurrentUser();
        setUser(profile);
        if (AUTH_DEBUG) console.debug("[auth] hydrate: profile loaded");
      } catch (error) {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401 && parsed.refresh) {
          if (AUTH_DEBUG) console.debug("[auth] hydrate: access expired (401), refreshing");
          const { access } = await refreshToken(parsed.refresh);
          const nextTokens = { ...parsed, access };
          persistTokens(nextTokens);
          const profile = await fetchCurrentUser();
          setUser(profile);
          if (AUTH_DEBUG) console.debug("[auth] hydrate: refresh ok, profile reloaded");
        } else {
          if (AUTH_DEBUG) console.debug("[auth] hydrate: profile fetch failed", { status, error });
          throw error;
        }
      }
    } catch (error) {
      console.warn("Failed to hydrate session", error);
      persistTokens(null);
    } finally {
      setLoading(false);
      if (AUTH_DEBUG) console.debug("[auth] hydrate: done");
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
      // Keep access tokens fresh while the app is open.
      // Only log out when refresh is definitively invalid/expired (400/401).
      timer = window.setInterval(async () => {
        try {
          if (AUTH_DEBUG) console.debug("[auth] refresh: ticking");
          const { access } = await refreshToken(tokens.refresh);
          const nextTokens = { ...tokens, access };
          persistTokens(nextTokens);
          if (AUTH_DEBUG) console.debug("[auth] refresh: ok");
        } catch (error) {
          console.warn("Token refresh failed", error);
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status === 401 || status === 400) {
            if (AUTH_DEBUG) console.debug("[auth] refresh: invalid refresh token, logging out", { status });
            logout();
          } else {
            if (AUTH_DEBUG) console.debug("[auth] refresh: transient failure (keeping session)", { status, error });
          }
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
