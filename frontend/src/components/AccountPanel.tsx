import { useState } from "react";
import type { FormEvent } from "react";

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

  if (!open || !user) {
    return null;
  }

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

  return (
    <div className="account-page" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="account-page-panel" onClick={(event) => event.stopPropagation()}>
        <button className="account-close-button" aria-label="Close account panel" onClick={handleClose}>
          ×
        </button>
       
        <form className="account-form form" onSubmit={handleSubmit}>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                markDirty();
              }}
              placeholder="Add a name"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                markDirty();
              }}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}
          <div className="account-form-actions">
            <button type="submit" className="primary" disabled={status === "saving"}>
              {status === "saving" ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountPanel;
