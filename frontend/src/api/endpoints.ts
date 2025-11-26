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

export const fetchRandomTitle = async (category?: TitleCategory) => {
  const { data } = await apiClient.get<TitleBundle>("/titles/random/", {
    params: category ? { category } : undefined,
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

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await apiClient.post<Tokens>("/auth/token/", payload);
  return data;
};

export const refreshToken = async (refresh: string) => {
  const { data } = await apiClient.post<{ access: string }>(
    "/auth/token/refresh/",
    { refresh }
  );
  return data;
};

export const register = async (payload: {
  email: string;
  password: string;
  display_name?: string;
}) => {
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register/",
    payload
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
