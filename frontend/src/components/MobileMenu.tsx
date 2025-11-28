import type { TitleCategory, User } from "../types/api";
import { getDisplayName } from "../utils/user";
import CategoryFilter from "./CategoryFilter";

interface MobileMenuProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onOpenAccount: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onAddTitle: () => void;
  category: TitleCategory | "";
  onCategoryChange: (value: TitleCategory | "") => void;
}

const MobileMenu = ({
  isOpen,
  user,
  onClose,
  onOpenAccount,
  onLogout,
  onOpenAuth,
  onAddTitle,
  category,
  onCategoryChange,
}: MobileMenuProps) => {
  const mobileAccountName = user ? getDisplayName(user) : "";

  return (
    <div
      className={isOpen ? "mobile-menu-overlay mobile-menu-open" : "mobile-menu-overlay"}
      aria-hidden={!isOpen}
      onClick={onClose}
    >
      <div className="mobile-menu-panel" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-menu-panel-header">
          <button type="button" className="icon-button" aria-label="Close menu" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mobile-menu-section">
          <p className="mobile-menu-subheading">{mobileAccountName}</p>
          {user ? (
            <div className="mobile-account-summary">
              <div className="mobile-account-actions">
                <button
                  className="primary"
                  onClick={() => {
                    onOpenAccount();
                    onClose();
                  }}
                >
                  Account settings
                </button>
                <button
                  className="ghost-button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <button
              className="primary"
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
            >
              Log in
            </button>
          )}
        </div>
        {user ? (
          <div className="mobile-menu-section">
            <p className="mobile-menu-subheading">Titles</p>
            <button
              className="primary button-medium"
              onClick={() => {
                onAddTitle();
                onClose();
              }}
            >
              Add a Title
            </button>
          </div>
        ) : null}
        <div className="mobile-menu-section">
          <p className="mobile-menu-subheading">Filters</p>
          <CategoryFilter variant="menu" value={category} onChange={onCategoryChange} />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
