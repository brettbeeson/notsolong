import { isAxiosError } from "axios";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import TurnstileWidget, { type TurnstileHandle } from "./TurnstileWidget";

type AuthView = "login" | "register" | "forgot" | "reset";

interface ResetParams {
  uid: string;
  token: string;
  email?: string;
}

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  initialView?: AuthView;
  resetParams?: ResetParams | null;
  onResetParamsCleared?: () => void;
}

const AuthDialog = ({
  open,
  onClose,
  initialView = "login",
  resetParams = null,
  onResetParamsCleared,
}: AuthDialogProps) => {
  const {
    login,
    register,
    requestPasswordReset,
    completePasswordReset,
    loginWithGoogle,
  } = useAuth();

  const [view, setView] = useState<AuthView>(initialView);
  const [fields, setFields] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [resetFields, setResetFields] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<AuthView | "google" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle | null>(null);
  const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const turnstileKeyMissing = !turnstileEnabled;
  const [activeResetParams, setActiveResetParams] = useState<ResetParams | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  const googleEnabled = Boolean(googleClientId);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoadMessage, setGoogleLoadMessage] = useState<string | null>(null);

  const formatAuthError = useCallback(
    (context: "login" | "register", error: unknown) => {
      if (isAxiosError(error)) {
        console.error(`Auth ${context} failed`, {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error(`Auth ${context} failed`, error);
      }
      return getErrorMessage(error, `Unable to ${context}. Please try again.`);
    },
    []
  );

  const resetTurnstileWidget = () => {
    if (!turnstileEnabled) return;
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const showTurnstile = turnstileEnabled && (view === "login" || view === "register");

  const clearResetContext = useCallback(() => {
    if (activeResetParams) {
      setActiveResetParams(null);
      onResetParamsCleared?.();
    }
  }, [activeResetParams, onResetParamsCleared]);

  const switchView = useCallback(
    (nextView: AuthView, options?: { keepSuccess?: boolean }) => {
      setView(nextView);
      setError(null);
      if (!options?.keepSuccess) {
        setSuccessMessage(null);
      }
      if (nextView !== "login" && nextView !== "register") {
        resetTurnstileWidget();
      }
      if (nextView !== "reset") {
        clearResetContext();
      }
    },
    [clearResetContext]
  );

  const handleDialogClose = () => {
    clearResetContext();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      switchView(initialView);
      setFields({ email: "", password: "", username: "" });
      setResetFields({ newPassword: "", confirmPassword: "" });
      setError(null);
      setSuccessMessage(null);
      setLoadingAction(null);
      setActiveResetParams(null);
      resetTurnstileWidget();
      return;
    }
    setLoadingAction(null);
    setError(null);
  }, [open, initialView, switchView]);

  useEffect(() => {
    if (open && resetParams) {
      setActiveResetParams(resetParams);
      setView("reset");
      setError(null);
      setSuccessMessage(null);
      if (resetParams.email) {
        setFields((prev) => ({ ...prev, email: resetParams.email ?? prev.email }));
      }
    }
  }, [resetParams, open]);

  useEffect(() => {
    if (!googleEnabled || typeof window === "undefined") {
      return;
    }

    const scriptId = "google-identity-service";
    const handleReady = () => {
      setGoogleReady(true);
      setGoogleLoadMessage(null);
    };
    const handleError = () => {
      setGoogleReady(false);
      setGoogleLoadMessage("Google sign-in is unavailable right now.");
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (window.google?.accounts?.oauth2) {
      handleReady();
      return;
    }

    const script = existingScript ?? document.createElement("script");
    if (!existingScript) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleReady);
    script.addEventListener("error", handleError);

    return () => {
      script.removeEventListener("load", handleReady);
      script.removeEventListener("error", handleError);
    };
  }, [googleEnabled]);

  const ensureTurnstile = () => {
    if (!showTurnstile) {
      return true;
    }
    if (!turnstileToken) {
      setError("Please complete the verification challenge.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
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
        turnstileToken: showTurnstile ? turnstileToken ?? undefined : undefined,
      });
      handleDialogClose();
    } catch (err) {
      setError(formatAuthError("login", err));
    } finally {
      setLoadingAction(null);
      resetTurnstileWidget();
    }
  };

  const handleRegister = async () => {
    setError(null);
    setSuccessMessage(null);
    const email = fields.email.trim();
    if (!email || !fields.password) {
      setError("Email and password are required.");
      return;
    }
    if (fields.password.length < 8) {
      setError("Use at least 8 characters for your password.");
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
        username: fields.username.trim() || undefined,
        turnstileToken: showTurnstile ? turnstileToken ?? undefined : undefined,
      });
      handleDialogClose();
    } catch (err) {
      setError(formatAuthError("register", err));
    } finally {
      setLoadingAction(null);
      resetTurnstileWidget();
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccessMessage(null);
    const email = fields.email.trim();
    if (!email) {
      setError("Enter the email used for your account.");
      return;
    }
    setLoadingAction("forgot");
    try {
      await requestPasswordReset(email);
      setSuccessMessage("Check your inbox for a password reset link.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!activeResetParams) {
      setError("Reset link expired. Request a new one.");
      return;
    }
    if (!resetFields.newPassword) {
      setError("Enter a new password.");
      return;
    }
    if (resetFields.newPassword !== resetFields.confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    setLoadingAction("reset");
    try {
      await completePasswordReset({
        uid: activeResetParams.uid,
        token: activeResetParams.token,
        newPassword: resetFields.newPassword,
        confirmPassword: resetFields.confirmPassword,
      });
      setResetFields({ newPassword: "", confirmPassword: "" });
      setSuccessMessage("Password updated. Please log in with your new password.");
      switchView("login", { keepSuccess: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError("Google sign-in is not configured.");
      return;
    }
    if (loadingAction === "google") {
      return;
    }
    if (!googleReady || typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      setError("Google sign-in is still loading. Please try again in a moment.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoadingAction("google");

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: "openid email profile",
      prompt: "select_account",
      callback: async (response) => {
        if (!response.access_token) {
          setError(response.error_description || "Google sign-in failed.");
          setLoadingAction(null);
          return;
        }
        try {
          await loginWithGoogle(response.access_token);
          handleDialogClose();
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setLoadingAction(null);
        }
      },
      error_callback: (error) => {
        console.warn("Google login error", error);
        setError("Google sign-in was cancelled.");
        setLoadingAction(null);
      },
    });

    client.requestAccessToken({ prompt: "consent" });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (view === "login") {
      void handleLogin();
    } else if (view === "register") {
      void handleRegister();
    } else if (view === "forgot") {
      void handleForgotPassword();
    } else {
      void handleResetPassword();
    }
  };

  const submitLabel = {
    login: loadingAction === "login" ? "Logging in..." : "Log in",
    register: loadingAction === "register" ? "Registering..." : "Register",
    forgot: loadingAction === "forgot" ? "Sending link..." : "Send reset link",
    reset: loadingAction === "reset" ? "Updating password..." : "Update password",
  }[view];

  const disableSubmit = (() => {
    if (view === "login") {
      return loadingAction === "login" || (showTurnstile && !turnstileToken);
    }
    if (view === "register") {
      return (
        loadingAction === "register" ||
        (showTurnstile && !turnstileToken) ||
        turnstileKeyMissing
      );
    }
    return loadingAction === view;
  })();

  const showTabs = view === "login" || view === "register";
  const showGoogleOption = googleEnabled && showTabs;
  const googleButtonDisabled = loadingAction === "google" || !googleReady;

  const renderSecondaryActions = () => {
    if (view === "login") {
      return (
        <Stack spacing={1} mt={1}>
          <Button
            type="button"
            variant="text"
            onClick={() => switchView("forgot")}
          >
            Forgot password?
          </Button>
          <Button
            type="button"
            variant="text"
            onClick={() => switchView("register")}
          >
            Need an account? Register
          </Button>
        </Stack>
      );
    }
    if (view === "register") {
      return (
        <Button
          type="button"
          variant="text"
          onClick={() => switchView("login")}
        >
          Already have an account? Log in
        </Button>
      );
    }
    return (
      <Button type="button" variant="text" onClick={() => switchView("login")}>
        Back to log in
      </Button>
    );
  };

  const title = (() => {
    switch (view) {
      case "register":
        return "Create an account";
      case "forgot":
        return "Reset your password";
      case "reset":
        return "Choose a new password";
      default:
        return "Welcome back";
    }
  })();

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      {showTabs && (
        <Tabs
          value={view}
          onChange={(_, value) => switchView(value as AuthView)}
          variant="fullWidth"
        >
          <Tab label="Log in" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      )}
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
          mt={1}
        >
          {showGoogleOption && (
            <Stack spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleGoogleLogin()}
                disabled={googleButtonDisabled}
              >
                {loadingAction === "google" ? "Connecting..." : "Continue with Google"}
              </Button>
              {!googleReady && !googleLoadMessage && (
                <Typography variant="caption" color="text.secondary">
                  Preparing Google sign-in…
                </Typography>
              )}
              {googleLoadMessage && <Alert severity="warning">{googleLoadMessage}</Alert>}
            </Stack>
          )}

          {showGoogleOption && <Divider>or</Divider>}

          {view === "forgot" && (
            <Typography color="text.secondary">
              Enter your email address and we&apos;ll send you a reset link.
            </Typography>
          )}
          {view === "reset" && (
            <Typography color="text.secondary">
              Resetting password for {activeResetParams?.email ?? "your account"}.
            </Typography>
          )}

          {(view === "login" || view === "register" || view === "forgot") && (
            <TextField
              label="Email"
              type="email"
              value={fields.email}
              onChange={(e) => setFields((prev) => ({ ...prev, email: e.target.value }))}
              required
              autoFocus
            />
          )}

          {view === "register" && (
            <TextField
              label="Username"
              value={fields.username}
              onChange={(e) => setFields((prev) => ({ ...prev, username: e.target.value }))}
              helperText="Shown publicly with your recaps"
            />
          )}

          {(view === "login" || view === "register") && (
            <TextField
              label="Password"
              type="password"
              value={fields.password}
              onChange={(e) => setFields((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          )}

          {view === "reset" && (
            <>
              <TextField
                label="New password"
                type="password"
                value={resetFields.newPassword}
                onChange={(e) =>
                  setResetFields((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                required
              />
              <TextField
                label="Confirm new password"
                type="password"
                value={resetFields.confirmPassword}
                onChange={(e) =>
                  setResetFields((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                required
              />
            </>
          )}

          {turnstileKeyMissing && view === "register" && (
            <Alert severity="warning">
              Account creation is temporarily disabled because the verification key is missing.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          {showTurnstile && (
            <Box display="flex" justifyContent="center">
              <TurnstileWidget
                ref={turnstileRef}
                onTokenChange={setTurnstileToken}
                action="auth-dialog"
              />
            </Box>
          )}

          <Stack spacing={1} mt={1}>
            <Button type="submit" variant="contained" disabled={disableSubmit}>
              {submitLabel}
            </Button>
            {renderSecondaryActions()}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
