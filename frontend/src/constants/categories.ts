import type { TitleCategory } from "../types/api";

export const CATEGORY_OPTIONS: { label: string; value: TitleCategory | "" }[] =
  [
    { label: "All", value: "" },
    { label: "Books", value: "book" },
    { label: "Movies", value: "movie" },
    { label: "Podcasts", value: "podcast" },
    { label: "Speeches", value: "speech" },
    { label: "Other", value: "other" },
  ];
