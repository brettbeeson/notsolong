import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { Modal } from "./Modal";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "login" | "register";

const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loginFields, setLoginFields] = useState({ email: "", password: "" });
  const [registerFields, setRegisterFields] = useState({
    email: "",
    password: "",
    display_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("login");
      setError(null);
      setLoginFields({ email: "", password: "" });
      setRegisterFields({ email: "", password: "", display_name: "" });
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === "login") {
      const email = loginFields.email.trim();
      if (!email || !loginFields.password) {
        setError("Enter both your email and password.");
        return;
      }
      setLoading(true);
      try {
        await login({ email, password: loginFields.password });
        onClose();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    const email = registerFields.email.trim();
    if (!email || !registerFields.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password: registerFields.password,
        display_name: registerFields.display_name || undefined,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={mode === "login" ? "Log in" : "Create an account"} onClose={onClose}>
      <div className="tab-row">
        <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}> 
          Log in
        </button>
        <button className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")}>
          Register
        </button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={mode === "login" ? loginFields.email : registerFields.email}
            onChange={(e) =>
              mode === "login"
                ? setLoginFields((prev) => ({ ...prev, email: e.target.value }))
                : setRegisterFields((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={mode === "login" ? loginFields.password : registerFields.password}
            onChange={(e) =>
              mode === "login"
                ? setLoginFields((prev) => ({ ...prev, password: e.target.value }))
                : setRegisterFields((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />
        </label>
        {mode === "register" && (
          <label>
            Display name
            <input
              value={registerFields.display_name}
              onChange={(e) => setRegisterFields((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder="Optional"
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Submitting..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </Modal>
  );
};

export default AuthDialog;
