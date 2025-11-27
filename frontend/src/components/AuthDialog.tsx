import { useEffect, useRef, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { Modal } from "./Modal";
import TurnstileWidget, { type TurnstileHandle } from "./TurnstileWidget";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const { login, register } = useAuth();
  const [fields, setFields] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"login" | "register" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle | null>(null);
  const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const turnstileKeyMissing = !turnstileEnabled;

  useEffect(() => {
    if (!open) {
      setError(null);
      setFields({ email: "", password: "" });
      setLoadingAction(null);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }, [open]);

  const ensureTurnstile = () => {
    if (!turnstileEnabled) {
      return true;
    }
    if (!turnstileToken) {
      setError("Please complete the verification challenge.");
      return false;
    }
    return true;
  };

  const resetTurnstile = () => {
    if (!turnstileEnabled) {
      return;
    }
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const handleLogin = async () => {
    setError(null);
    const email = fields.email.trim();
    if (!email || !fields.password) {
      setError("Enter both your email and password.");
      return;
    }
    if (!ensureTurnstile()) {
      return;
    }
    setLoadingAction("login");
    try {
      await login({
        email,
        password: fields.password,
        turnstileToken: turnstileEnabled ? turnstileToken ?? undefined : undefined,
      });
      onClose();
    } catch (err) {
      
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
      resetTurnstile();
    }
  };

  const handleRegister = async () => {
    setError(null);
    const email = fields.email.trim();
    if (!email || !fields.password) {
      setError("Email and password are required.");
      return;
    }
    if (!ensureTurnstile()) {
      return;
    }
    setLoadingAction("register");
    try {
      await register({
        email,
        password: fields.password,
        turnstileToken: turnstileEnabled ? turnstileToken ?? undefined : undefined,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
      resetTurnstile();
    }
  };

  return (
    <Modal open={open} title="Log in or Register" onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLogin();
        }}
      >
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
        {turnstileKeyMissing && (
          <p className="turnstile-error">
            Account creation is temporarily disabled because the Turnstile key is missing.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="auth-dialog-actions">
          <button
            type="submit"
            className="primary"
            onClick={handleLogin}
            disabled={
              loadingAction === "login" || (turnstileEnabled && !turnstileToken)
            }
          >
            {loadingAction === "login" ? "Logging in..." : "Log in"}
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleRegister}
            disabled={
              loadingAction === "register" ||
              (turnstileEnabled && !turnstileToken) ||
              turnstileKeyMissing
            }
          >
            {loadingAction === "register" ? "Registering..." : "Register"}
          </button>
          {turnstileEnabled && (
          <div className="turnstile-wrapper">
            <TurnstileWidget
              ref={turnstileRef}
              onTokenChange={setTurnstileToken}
              action="auth-dialog"
            />
          </div>
        )}
        
        </div>
      </form>
    </Modal>
  );
};

export default AuthDialog;
