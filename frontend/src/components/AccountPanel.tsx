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
import { getErrorMessage } from "../utils/errors";

interface AccountPanelProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (payload: { username?: string; email?: string }) => Promise<void>;
}

const AccountPanel = ({ open, user, onClose, onSave }: AccountPanelProps) => {
  const [draft, setDraft] = useState<{
    key: string;
    values: { username?: string; email?: string };
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const userKey = user ? `${user.email ?? "anon"}:${user.username ?? ""}:${user.email ?? ""}` : "guest";
  const draftValues = draft?.key === userKey ? draft.values : null;
  const username = draftValues?.username ?? user?.username ?? "";
  const email = draftValues?.email ?? user?.email ?? "";

  const resetState = () => {
    setDraft(null);
    setStatus("idle");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setStatus("saving");
    setError(null);
    try {
      await onSave({ username, email });
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
        <DialogTitle>{`Account and Settings`}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => {
                setDraft({
                  key: userKey,
                  values: { ...(draftValues ?? { username, email }), username: e.target.value },
                });
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Add a username"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setDraft({
                  key: userKey,
                  values: { ...(draftValues ?? { username, email }), email: e.target.value },
                });
                if (error) {
                  setError(null);
                }
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
