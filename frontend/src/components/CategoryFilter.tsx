import { useEffect, useRef, useState } from "react";

import type { TitleCategory } from "../types/api";

const categories: { label: string; value: TitleCategory | "" }[] = [
  { label: "All", value: "" },
  { label: "Books", value: "book" },
  { label: "Movies", value: "movie" },
  { label: "Podcasts", value: "podcast" },
  { label: "Speeches", value: "speech" },
  { label: "Other", value: "other" },
];

interface CategoryFilterProps {
  value: TitleCategory | "";
  onChange: (value: TitleCategory | "") => void;
  variant?: "default" | "menu";
}

const CategoryFilter = ({ value, onChange, variant = "default" }: CategoryFilterProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const handleSelect = (category: TitleCategory | "") => {
    onChange(category);
    setMenuOpen(false);
  };

  const selectedLabel = categories.find((category) => category.value === value)?.label ?? "All";

  const rootClassName = variant === "menu" ? "category-filter category-filter-menu" : "category-filter";

  return (
    <div className={rootClassName}>
      <div className="category-chips" aria-label="Filter by category">
        {categories.map((category) => (
          <button
            key={category.value || "all"}
            className={category.value === value ? "chip chip-active" : "chip"}
            onClick={() => onChange(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {variant === "default" && (
        <div className="category-filter-mobile" ref={menuRef}>
          <button
            type="button"
            className="filter-icon-button"
            aria-label="Choose category"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="4 4 20 4 14 12 14 19 10 21 10 12 4 4" />
            </svg>
            <span>{selectedLabel}</span>
          </button>

          {menuOpen && (
            <div className="category-filter-sheet" role="menu">
              {categories.map((category) => (
                <button
                  key={`mobile-${category.value || "all"}`}
                  type="button"
                  className={category.value === value ? "sheet-option sheet-option-active" : "sheet-option"}
                  onClick={() => handleSelect(category.value)}
                  role="menuitemradio"
                  aria-checked={category.value === value}
                >
                  {category.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
