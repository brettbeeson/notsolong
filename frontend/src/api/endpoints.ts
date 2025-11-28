import { apiClient } from "./client";
import { isAxiosError } from "axios";
import type {
  Recap,
  RegisterResponse,
  Title,
  TitleBundle,
  TitleCategory,
  Tokens,
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
  turnstile_token?: string;
};

export const register = async ({
  email,
  password,
  turnstile_token,
}: RegisterPayload) => {
  const body: RegisterPayload = { email, password };
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
