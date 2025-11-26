import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { Modal } from "./Modal";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const { login, register } = useAuth();
  const [fields, setFields] = useState({ email: "", password: "", display_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"login" | "register" | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setFields({ email: "", password: "", display_name: "" });
      setLoadingAction(null);
    }
  }, [open]);

  const handleLogin = async () => {
    setError(null);
    const email = fields.email.trim();
    if (!email || !fields.password) {
      setError("Enter both your email and password.");
      return;
    }
    setLoadingAction("login");
    try {
      await login({ email, password: fields.password });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegister = async () => {
    setError(null);
    const email = fields.email.trim();
    if (!email || !fields.password) {
      setError("Email and password are required.");
      return;
    }
    setLoadingAction("register");
    try {
      await register({
        email,
        password: fields.password,
        display_name: fields.display_name || undefined,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal open={open} title="Log in or Register" onClose={onClose}>
      <form className="form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Email
          <input
            type="email"
            value={fields.email}
            onChange={(e) => setFields((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={fields.password}
            onChange={(e) => setFields((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>
        <label>
          Display name
          <input
            value={fields.display_name}
            onChange={(e) => setFields((prev) => ({ ...prev, display_name: e.target.value }))}
            placeholder="Optional (used when registering)"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="auth-dialog-actions">
          <button
            type="button"
            className="primary"
            onClick={handleLogin}
            disabled={loadingAction === "login"}
          >
            {loadingAction === "login" ? "Logging in..." : "Log in"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleRegister}
            disabled={loadingAction === "register"}
          >
            {loadingAction === "register" ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AuthDialog;
