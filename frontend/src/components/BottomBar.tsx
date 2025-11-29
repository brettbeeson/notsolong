import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { Box, Button, Menu, MenuItem, Paper } from "@mui/material";
import { useEffect, useState } from "react";

import { CATEGORY_OPTIONS } from "../constants/categories";
import type { TitleCategory } from "../types/api";

interface BottomBarProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  category: TitleCategory | "";
  onCategoryChange: (value: TitleCategory | "") => void;
}

const useVisualViewportOffset = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const nextOffset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setOffset(nextOffset);
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);
    handleViewportChange();

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  return offset;
};

const BottomBar = ({ onBack, onNext, disableBack, disableNext, category, onCategoryChange }: BottomBarProps) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const viewportOffset = useVisualViewportOffset();
  const selectedLabel = CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "All";

  const closeFilterMenu = () => setFilterAnchor(null);

  const transformStyle = viewportOffset ? { transform: `translateY(-${viewportOffset}px)` } : undefined;

  return (
    <Paper
      role="toolbar"
      aria-label="Mobile navigation bar"
      elevation={12}
      sx={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.85rem)",
        width: "auto",
        maxWidth: 520,
        margin: "0 auto",
        padding: 1,
        borderRadius: 4,
        backdropFilter: "blur(18px)",
        backgroundColor: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(63, 42, 252, 0.08)",
        boxShadow: "0 10px 26px rgba(15,13,36,0.22)",
        boxSizing: "border-box",
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
      style={transformStyle}
    >
      <Box display="grid" gridTemplateColumns="auto 1fr auto" alignItems="center" columnGap={1.25}>
        <Button
          variant="outlined"
          color="primary"
          onClick={onBack}
          disabled={disableBack}
          aria-label="Show previous title"
          sx={{ borderRadius: "50%", minWidth: 0, width: 52, height: 52, p: 0 }}
        >
          <ArrowBackRoundedIcon />
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FilterAltRoundedIcon />}
          onClick={(event) => setFilterAnchor(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(filterAnchor)}
          sx={{ justifySelf: "center" }}
        >
          {selectedLabel}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={onNext}
          disabled={disableNext}
          aria-label="Show next title"
          sx={{ borderRadius: "50%", minWidth: 0, width: 52, height: 52, p: 0 }}
        >
          <ArrowForwardRoundedIcon />
        </Button>
      </Box>
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={closeFilterMenu}
        MenuListProps={{ "aria-label": "Choose category" }}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <MenuItem
            key={`mobile-filter-${option.value || "all"}`}
            selected={option.value === category}
            onClick={() => {
              onCategoryChange(option.value);
              closeFilterMenu();
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default BottomBar;
