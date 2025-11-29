import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { User } from "../types/api";
import { getDisplayName } from "../utils/user";

interface UserMenuProps {
  user: User;
  onAccount: () => void;
  onLogout: () => void;
  onAddTitle: () => void;
  highlightAddTitle?: boolean;
}

const UserMenu = ({ user, onAccount, onLogout, onAddTitle, highlightAddTitle = false }: UserMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        color="primary"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="Open user menu"
        className={highlightAddTitle ? "attention-pulse" : undefined}
      >
        <MenuRoundedIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box px={2} py={1.5} display="flex" gap={2} alignItems="center">
          <Avatar>{getDisplayName(user).charAt(0)}</Avatar>
          <Box>
            <Typography fontWeight={600}>{getDisplayName(user)}</Typography>
            {user.email && (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 1 }}  />
        <MenuItem
          onClick={() => {
            handleClose();
            onAddTitle();
          }}
          sx={{
            gap: 1,
            borderRadius: 1,
            bgcolor: highlightAddTitle ? "action.selected" : undefined,
            color: "primary.main" ,
          }}
        >
          
          
          
          <ListItemText
            primary="Add a Title"
            secondary="Share the next great recap"
            
          />
        </MenuItem>
        <Divider  variant="middle" />
        <MenuItem
          onClick={() => {
            handleClose();
            onAccount();
          }}
          sx={{ color: "primary.main" }}
        >
          Settings
        </MenuItem>
        
        <Divider   />
        <MenuItem
          onClick={() => {
            handleClose();
            onLogout();
          }}
         sx={{ color: "error.main" }}
        >
          Log out
        </MenuItem>
        
      </Menu>
    </>
  );
};

export default UserMenu;
