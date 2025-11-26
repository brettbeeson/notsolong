export type TitleCategory = "book" | "movie" | "podcast" | "speech" | "other";

export interface User {
  email: string;
  display_name?: string | null;
}

export interface Title {
  id: number;
  name: string;
  category: TitleCategory;
  author?: string | null;
  created_at: string;
}

export interface NoSoLong {
  id: number;
  title: Title;
  user: User;
  text: string;
  score: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  current_user_vote?: -1 | 0 | 1 | null;
}

export interface TitleBundle {
  title: Title;
  top_nosolong: NoSoLong | null;
  other_nosolongs: NoSoLong[];
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  user: User;
  tokens: Tokens;
}
