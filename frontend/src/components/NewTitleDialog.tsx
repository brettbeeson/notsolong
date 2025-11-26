import { useState } from "react";
import type { FormEvent } from "react";

import { createTitle, fetchTitleSummary } from "../api/endpoints";
import type { Title, TitleBundle, TitleCategory } from "../types/api";
import { getErrorMessage } from "../utils/errors";
import { Modal } from "./Modal";

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
      const title: Title = await createTitle({ name, category, author });
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
    <Modal open={open} title="Add a new Title" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as TitleCategory)}>
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Author / Creator
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Optional" />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Saving..." : "Create Title"}
        </button>
      </form>
    </Modal>
  );
};

export default NewTitleDialog;
