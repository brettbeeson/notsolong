import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import type { User } from "../types/api";
import { getDisplayName } from "../utils/user";
import { getErrorMessage } from "../utils/errors";

interface AccountPanelProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (payload: { display_name?: string; email?: string }) => Promise<void>;
}

const AccountPanel = ({ open, user, onClose, onSave }: AccountPanelProps) => {
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStatus("idle");
    setError(null);
  };

  const markDirty = () => {
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setStatus("saving");
    setError(null);
    try {
      await onSave({ display_name: displayName, email });
      handleClose();
    } catch (err) {
      setStatus("idle");
      setError(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  if (!open || !user) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column">
        <DialogTitle>{`Account • ${getDisplayName(user)}`}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                markDirty();
              }}
              placeholder="Add a name"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                markDirty();
              }}
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="submit" variant="contained" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AccountPanel;
