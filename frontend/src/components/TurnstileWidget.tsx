import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
  action?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
};

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let turnstileScriptPromise: Promise<void> | null = null;

const loadTurnstileScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile cannot load on the server"));
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        turnstileScriptPromise = null;
        reject(new Error("Failed to load Turnstile script"));
      };
      document.head.appendChild(script);
    });
  }
  return turnstileScriptPromise;
};

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void;
  action?: string;
  theme?: "light" | "dark" | "auto";
}

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  ({ onTokenChange, action = "auth", theme = "light" }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    const reset = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      onTokenChange(null);
    }, [onTokenChange]);

    useImperativeHandle(ref, () => ({ reset }), [reset]);

    useEffect(() => {
      let cancelled = false;
      if (!siteKey) {
        onTokenChange(null);
        return () => {
          cancelled = true;
        };
      }

      const initialize = async () => {
        try {
          await loadTurnstileScript();
          if (cancelled || !containerRef.current || !window.turnstile) {
            return;
          }
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onTokenChange(token),
            "expired-callback": () => onTokenChange(null),
            "timeout-callback": () => onTokenChange(null),
            "error-callback": () => onTokenChange(null),
            action,
            theme,
            size: "compact",
          });
        } catch (error) {
          console.error("Turnstile failed to initialize", error);
        }
      };

      void initialize();

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
        onTokenChange(null);
      };
    }, [action, onTokenChange, theme]);

    if (!siteKey) {
      return <p className="turnstile-missing-note">Verification unavailable.</p>;
    }

    return <div className="turnstile-slot" ref={containerRef} />;
  }
);

TurnstileWidget.displayName = "TurnstileWidget";

export default TurnstileWidget;
