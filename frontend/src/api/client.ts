import axios from "axios";

import { clearStoredTokens, getStoredTokens, setStoredTokens } from "../auth/storage";

/*
In dev, /api is proxied to the backend server by Vite dev server.
In production, the frontend is served by the backend, so /api works there too.

Could remove axios and just use fetch
*/
export const apiClient = axios.create({
  baseURL: "/api",
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

let refreshInFlight: Promise<string> | null = null;

const isAuthRefreshRequest = (url?: string) => {
  if (!url) return false;
  return url.includes("/auth/token/refresh/");
};

const refreshAccessToken = async (): Promise<string> => {
  const stored = getStoredTokens();
  const refresh = stored?.refresh;
  if (!refresh) {
    throw new Error("No refresh token available");
  }

  // Avoid recursion: use a bare axios instance without interceptors.
  const bare = axios.create({ baseURL: "/api" });
  const { data } = await bare.post<{ access: string }>("/auth/token/refresh/", { refresh });

  const nextTokens = { ...stored, access: data.access };
  setStoredTokens(nextTokens);
  setAuthToken(data.access);
  return data.access;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as (typeof error)["config"] & { _retry?: boolean };

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthRefreshRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }

      const access = await refreshInFlight;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      // If refresh is truly invalid/expired, clear local session; UI can prompt re-login.
      clearStoredTokens();
      setAuthToken(null);
      return Promise.reject(refreshError);
    }
  }
);
