import type { Tokens } from "../types/api";

export const STORAGE_KEY = "notsolong-auth";

export const getStoredTokens = (): Tokens | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
};

export const setStoredTokens = (tokens: Tokens) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
};

export const clearStoredTokens = () => {
  localStorage.removeItem(STORAGE_KEY);
};
