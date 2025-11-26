import { useEffect, useRef, useState } from "react";

import type { User } from "../types/api";
import { getDisplayName } from "../utils/user";

interface UserMenuProps {
  user: User;
  onAccount: () => void;
  onLogout: () => void;
  onAddTitle: () => void;
}

const UserMenu = ({ user, onAccount, onLogout, onAddTitle }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open menu"
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="user-menu-popover" role="menu">
          <div className="user-menu-section">
            <p className="user-menu-subheading">Account</p>
            <p className="user-menu-name">{getDisplayName(user)}</p>
            {user.email && <p className="user-menu-email">{user.email}</p>}
            <div className="user-menu-actions">
              <button
                type="button"
                className="primary button-medium"
                onClick={() => {
                  setOpen(false);
                  onAccount();
                }}
              >
                Account settings
              </button>
              <button
                type="button"
                className="ghost-button button-medium"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <div className="user-menu-section">
            <p className="user-menu-subheading">Titles</p>
            <button
              type="button"
              className="primary button-medium"
              onClick={() => {
                setOpen(false);
                onAddTitle();
              }}
            >
              Add a Title
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
