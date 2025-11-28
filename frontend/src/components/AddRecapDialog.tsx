import { useEffect, useState, type FormEvent } from "react";
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

import { createRecap, updateRecap } from "../api/endpoints";
import type { Recap, Title } from "../types/api";
import { getErrorMessage } from "../utils/errors";

interface AddRecapDialogProps {
  open: boolean;
  title: Title | null;
  existingQuote: Recap | null;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const AddRecapDialog = ({ open, title, existingQuote, onClose, onCreated }: AddRecapDialogProps) => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(existingQuote);

  useEffect(() => {
    if (open) {
      setText(existingQuote?.text ?? "");
      setError(null);
    }
  }, [open, existingQuote]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title && !existingQuote) return;
    setLoading(true);
    setError(null);
    try {
      if (isEditing && existingQuote) {
        await updateRecap(existingQuote.id, { text });
      } else if (title) {
        await createRecap({ title: title.id, text });
      }
      setText("");
      await onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = isEditing
    ? `Edit your recap for ${existingQuote?.title.name ?? title?.name ?? "this title"}`
    : title
      ? `Add a recap for ${title.name}`
      : "Add a recap";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={handleSubmit}>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Recap"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            multiline
            minRows={4}
            autoFocus
          />
          {isEditing && (
            <Alert severity="info">Updating this text will replace your existing recap.</Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRecapDialog;
