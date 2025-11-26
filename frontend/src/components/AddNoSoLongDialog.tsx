import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createNoSoLong, updateNoSoLong } from "../api/endpoints";
import type { NoSoLong, Title } from "../types/api";
import { getErrorMessage } from "../utils/errors";
import { Modal } from "./Modal";

interface AddNoSoLongDialogProps {
  open: boolean;
  title: Title | null;
  existingQuote: NoSoLong | null;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

const AddNoSoLongDialog = ({ open, title, existingQuote, onClose, onCreated }: AddNoSoLongDialogProps) => {
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
        await updateNoSoLong(existingQuote.id, { text });
      } else if (title) {
        await createNoSoLong({ title: title.id, text });
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
      ? `Add a NoSoLong for ${title.name}`
      : "Add a NoSoLong";

  return (
    <Modal open={open} title={modalTitle} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Text
          <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={4} />
        </label>
        {isEditing && <p className="muted">Updating this text will replace your existing recap.</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Save"}
        </button>
      </form>
    </Modal>
  );
};

export default AddNoSoLongDialog;
