import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";

import { createTitle, fetchTitleSummary } from "../api/endpoints";
import type { Title, TitleBundle, TitleCategory } from "../types/api";
import { getErrorMessage } from "../utils/errors";

const categories: { label: string; value: TitleCategory }[] = [
  { label: "Book", value: "book" },
  { label: "Movie", value: "movie" },
  { label: "Podcast", value: "podcast" },
  { label: "Speech", value: "speech" },
  { label: "Other", value: "other" },
];

interface NewTitleDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (bundle: TitleBundle) => void;
}

const NewTitleDialog = ({ open, onClose, onCreated }: NewTitleDialogProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TitleCategory>("book");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Make load of the rings -> "Load of the Rings"
      const titleCaseName = name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const title: Title = await createTitle({ name: titleCaseName, category, author });
      const bundle = await fetchTitleSummary(title.id);
      onCreated(bundle);
      setName("");
      setAuthor("");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={handleSubmit}>
      <DialogTitle>Add a new Title</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <TextField
            label="Category"
            select
            value={category}
            onChange={(e) => setCategory(e.target.value as TitleCategory)}
          >
            {categories.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Author / Creator"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Optional"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Create Title"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewTitleDialog;
