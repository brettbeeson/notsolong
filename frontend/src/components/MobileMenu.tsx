import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import type { TitleCategory, User } from "../types/api";
import { getDisplayName } from "../utils/user";
import CategoryFilter from "./CategoryFilter";

interface MobileMenuProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onOpenAccount: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onAddTitle: () => void;
  category: TitleCategory | "";
  onCategoryChange: (value: TitleCategory | "") => void;
}

const MobileMenu = ({
  isOpen,
  user,
  onClose,
  onOpenAccount,
  onLogout,
  onOpenAuth,
  onAddTitle,
  category,
  onCategoryChange,
}: MobileMenuProps) => {
  const mobileAccountName = user ? getDisplayName(user) : "";
  const mobileEmailName = user && user.email ? user.email : "";

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose} PaperProps={{ sx: { width: 360, maxWidth: "100%" } }}>
      <Box display="flex" justifyContent="flex-end" px={1} pt={1}>
        <IconButton aria-label="Close menu" onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      <Stack spacing={3} px={3} pb={4} pt={1} role="menu">
        {user && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              Titles
            </Typography>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1.5 }}
              onClick={() => {
                onAddTitle();
                onClose();
              }}
            >
              Add a Title
            </Button>
          </Box>
        )}

        <Box>
          <Typography variant="overline" color="text.secondary">
            Filters
          </Typography>
          <Box mt={1.5}>
            <CategoryFilter variant="menu" value={category} onChange={onCategoryChange} />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary">
            {user ? `${mobileAccountName} (${mobileEmailName})` : "Welcome"}
          </Typography>
          {user ? (
            <Stack spacing={1.25} mt={1.5}>
              
              <Button
                variant="outlined"
                onClick={() => {
                  onOpenAccount();
                  onClose();
                }}
              >
                Settings
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                Log out
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1.5 }}
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
            >
              Log in
            </Button>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
};

export default MobileMenu;
