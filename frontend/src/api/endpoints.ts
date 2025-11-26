import { apiClient } from "./client";
import type {
  NoSoLong,
  RegisterResponse,
  Title,
  TitleBundle,
  TitleCategory,
  Tokens,
  User,
} from "../types/api";

export const fetchRandomTitle = async (options?: {
  category?: TitleCategory;
  exclude?: number[];
}) => {
  const params: Record<string, string> = {};
  if (options?.category) {
    params.category = options.category;
  }
  if (options?.exclude && options.exclude.length) {
    params.exclude = options.exclude.join(",");
  }

  const { data } = await apiClient.get<TitleBundle>("/titles/random/", {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
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

export const createNoSoLong = async (payload: {
  title: number;
  text: string;
}) => {
  const { data } = await apiClient.post<NoSoLong>("/nosolongs/", payload);
  return data;
};

export const voteNoSoLong = async (id: number, value: -1 | 0 | 1) => {
  const { data } = await apiClient.post<NoSoLong>(`/nosolongs/${id}/vote/`, {
    value,
  });
  return data;
};

export const updateNoSoLong = async (id: number, payload: { text: string }) => {
  const { data } = await apiClient.patch<NoSoLong>(
    `/nosolongs/${id}/`,
    payload
  );
  return data;
};

export const deleteNoSoLong = async (id: number) => {
  await apiClient.delete(`/nosolongs/${id}/`);
};

type LoginPayload = {
  email: string;
  password: string;
  turnstile_token?: string;
};

export const login = async ({
  email,
  password,
  turnstile_token,
}: LoginPayload) => {
  const body: LoginPayload = { email, password };
  if (turnstile_token) {
    body.turnstile_token = turnstile_token;
  }
  const { data } = await apiClient.post<Tokens>("/auth/token/", body);
  return data;
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
  display_name?: string;
  turnstile_token?: string;
};

export const register = async ({
  email,
  password,
  display_name,
  turnstile_token,
}: RegisterPayload) => {
  const body: RegisterPayload = { email, password };
  if (display_name) {
    body.display_name = display_name;
  }
  if (turnstile_token) {
    body.turnstile_token = turnstile_token;
  }
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register/",
    body
  );
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get<User>("/auth/me/");
  return data;
};

export const updateCurrentUser = async (
  payload: Partial<Pick<User, "display_name" | "email">>
) => {
  const { data } = await apiClient.patch<User>("/auth/me/", payload);
  return data;
};
