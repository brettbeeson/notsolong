import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { AppBar, BottomNavigation, BottomNavigationAction, Menu, MenuItem, Toolbar } from "@mui/material";
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
  nextExhausted?: boolean;
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

const BottomBar = ({ onBack, onNext, disableBack, disableNext, category, onCategoryChange, nextExhausted = false }: BottomBarProps) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const viewportOffset = useVisualViewportOffset();
  const selectedLabel = CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "All";

  const closeFilterMenu = () => setFilterAnchor(null);

  const transformStyle = viewportOffset ? { transform: `translateY(-${viewportOffset}px)` } : undefined;

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={6}
      style={transformStyle}
      sx={{
        top: "auto",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.25rem)",
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Toolbar disableGutters sx={{ justifyContent: "center" }}>
        <BottomNavigation
          showLabels
          sx={(theme) => ({
            width: "min(520px, 100%)",
            backgroundColor: "transparent",
            "& .MuiBottomNavigationAction-root": {
              color: theme.palette.text.primary,
              fontWeight: 600,
              "&.Mui-disabled": {
                color: theme.palette.text.disabled,
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.85rem",
              },
            },
          })}
        >
          <BottomNavigationAction
            label="Back"
            icon={<ArrowBackRoundedIcon />}
            onClick={onBack}
            disabled={disableBack}
          />
          <BottomNavigationAction
            label={selectedLabel}
            icon={<FilterAltRoundedIcon />}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          />
          <BottomNavigationAction
            label="Next"
            icon={<ArrowForwardRoundedIcon />}
            onClick={onNext}
            disabled={disableNext}
            sx={(theme) => ({
              color: nextExhausted ? theme.palette.text.disabled : undefined,
            })}
          />
        </BottomNavigation>
      </Toolbar>
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
    </AppBar>
  );
};

export default BottomBar;
