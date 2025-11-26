import { useEffect, useRef, useState } from "react";

import type { User } from "../types/api";
import { getDisplayName } from "../utils/user";

interface UserMenuProps {
  user: User;
  onAccount: () => void;
  onLogout: () => void;
}

const UserMenu = ({ user, onAccount, onLogout }: UserMenuProps) => {
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

  const initials = getDisplayName(user)
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {initials || "Me"}
      </button>
      {open && (
        <div className="user-menu-popover" role="menu">
          <p className="user-menu-name">{getDisplayName(user)}</p>
          <button className="user-menu-item" onClick={() => { setOpen(false); onAccount(); }}>
            Account
          </button>
          <button className="user-menu-item" onClick={() => { setOpen(false); onLogout(); }}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
