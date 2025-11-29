import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

import type { TitleCategory } from "../types/api";
import { CATEGORY_OPTIONS } from "../constants/categories";

interface CategoryFilterProps {
  value: TitleCategory | "";
  onChange: (value: TitleCategory | "") => void;
}

const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  const handleSelect = (_: unknown, newValue: TitleCategory | "" | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleSelect}
        size="small"
        color="primary"
        sx={{ flexWrap: "wrap" }}
      >
        {CATEGORY_OPTIONS.map((category) => (
          <ToggleButton key={category.value || "all"} value={category.value} sx={{ borderRadius: 999, px: 2 }}>
            {category.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

export default CategoryFilter;
