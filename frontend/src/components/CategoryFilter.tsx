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
}

const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {

  return (
    <div className="category-filter">
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
  );
};

export default CategoryFilter;
