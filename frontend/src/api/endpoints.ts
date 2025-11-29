import { apiClient } from "./client";
import { isAxiosError } from "axios";
import type {
  AuthSession,
  Recap,
  Title,
  TitleBundle,
  TitleCategory,
  User,
} from "../types/api";

// Fetch a random title, optionally filtered by category and excluding certain IDs
// If all titles are excluded, API returns 404 and we return null
export class NoTitlesAvailableError extends Error {
  constructor(message = "No titles available") {
    super(message);
    this.name = "NoTitlesAvailableError";
  }
}

export const fetchRandomTitle = async (options?: {
  category?: TitleCategory;
  exclude?: number[];
}): Promise<TitleBundle | null> => {
  const params: Record<string, string> = {};
  if (options?.category) {
    params.category = options.category;
  }
  if (options?.exclude && options.exclude.length) {
    params.exclude = options.exclude.join(",");
  }

  try {
    const { data } = await apiClient.get<TitleBundle>("/titles/random/", {
      params: Object.keys(params).length ? params : undefined,
    });
    return data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 404) {
      if (options?.exclude?.length) {
        return null;
      }
      throw new NoTitlesAvailableError();
    }
    throw error; // re-throw other errors
  }
};

export const fetchTitleSummary = async (id: number) => {
  const { data } = await apiClient.get<TitleBundle>(`/titles/${id}/summary/`);
  return data;
};

export const createTitle = async (
  payload: Pick<Title, "name" | "category" | "author">
) => {
  const { data } = await apiClient.post<Title>("/titles/", payload);
  return data;
};

export const createRecap = async (payload: { title: number; text: string }) => {
  const { data } = await apiClient.post<Recap>("/recaps/", payload);
  return data;
};

export const voteRecap = async (id: number, value: -1 | 0 | 1) => {
  const { data } = await apiClient.post<Recap>(`/recaps/${id}/vote/`, {
    value,
  });
  return data;
};

export const updateRecap = async (id: number, payload: { text: string }) => {
  const { data } = await apiClient.patch<Recap>(`/recaps/${id}/`, payload);
  return data;
};

export const deleteRecap = async (id: number) => {
  await apiClient.delete(`/recaps/${id}/`);
};

type LoginPayload = {
  email: string;
  password: string;
  turnstile_token?: string;
};

type DjRestAuthJWTResponse = {
  access: string;
  refresh: string;
  user: User;
};

const mapAuthResponse = (data: DjRestAuthJWTResponse): AuthSession => ({
  user: data.user,
  tokens: {
    access: data.access,
    refresh: data.refresh,
  },
});

export const login = async ({
  email,
  password,
  turnstile_token,
}: LoginPayload) => {
  const body: LoginPayload = { email, password };
  if (turnstile_token) {
    body.turnstile_token = turnstile_token;
  }
  const { data } = await apiClient.post<DjRestAuthJWTResponse>(
    "/auth/login/",
    body
  );
  return mapAuthResponse(data);
};

export const refreshToken = async (refresh: string) => {
  const { data } = await apiClient.post<{ access: string }>(
    "/auth/token/refresh/",
    { refresh }
  );
  return data;
};

type RegisterPayload = {
  email: string;
  password: string;
  username?: string;
  turnstile_token?: string;
};

export const register = async ({
  email,
  password,
  username,
  turnstile_token,
}: RegisterPayload) => {
  const payload: Record<string, string> = {
    email,
    password1: password,
    password2: password,
  };
  if (username) {
    payload.username = username;
  }
  if (turnstile_token) {
    payload.turnstile_token = turnstile_token;
  }
  const { data } = await apiClient.post<DjRestAuthJWTResponse>(
    "/auth/registration/",
    payload
  );
  return mapAuthResponse(data);
};

export const loginWithGoogle = async (accessToken: string) => {
  const { data } = await apiClient.post<DjRestAuthJWTResponse>(
    "/auth/google/",
    {
      access_token: accessToken,
    }
  );
  return mapAuthResponse(data);
};

export const logout = async (refresh?: string) => {
  const body = refresh ? { refresh } : undefined;
  await apiClient.post("/auth/logout/", body);
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get<User>("/auth/user/");
  return data;
};

export const updateCurrentUser = async (
  payload: Partial<Pick<User, "username" | "email">>
) => {
  const { data } = await apiClient.patch<User>("/auth/user/", payload);
  return data;
};

export const requestPasswordReset = async (email: string) => {
  await apiClient.post("/auth/password/reset/", { email });
};

export const confirmPasswordReset = async (payload: {
  uid: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  await apiClient.post("/auth/password/reset/confirm/", {
    uid: payload.uid,
    token: payload.token,
    new_password1: payload.newPassword,
    new_password2: payload.confirmPassword,
  });
};
