import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { Button, Menu, MenuItem, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useState } from "react";

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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const selectedLabel = categories.find((category) => category.value === value)?.label ?? "All";

  const handleSelect = (_: unknown, newValue: TitleCategory | "" | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  if (variant === "menu") {
    return (
      <Stack spacing={1} width="100%">
        {categories.map((category) => {
          const active = category.value === value;
          return (
            <Button
              key={`menu-${category.value || "all"}`}
              variant={active ? "contained" : "outlined"}
              onClick={() => onChange(category.value)}
              fullWidth
            >
              {category.label}
            </Button>
          );
        })}
      </Stack>
    );
  }

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
        {categories.map((category) => (
          <ToggleButton key={category.value || "all"} value={category.value} sx={{ borderRadius: 999, px: 2 }}>
            {category.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <div>
        <Button
          variant="outlined"
          startIcon={<FilterAltRoundedIcon />}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
        >
          {selectedLabel}
        </Button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          MenuListProps={{ "aria-label": "Choose category" }}
        >
          {categories.map((category) => (
            <MenuItem
              key={`select-${category.value || "all"}`}
              selected={category.value === value}
              onClick={() => {
                onChange(category.value);
                setMenuAnchor(null);
              }}
            >
              {category.label}
            </MenuItem>
          ))}
        </Menu>
      </div>
    </Stack>
  );
};

export default CategoryFilter;
