import type { NoSoLong } from "../types/api";
import { getDisplayName } from "../utils/user";

interface NoSoLongCardProps {
  quote: NoSoLong;
  highlight?: boolean;
  owned?: boolean;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  disabled?: boolean;
  userVoteOverride?: -1 | 0 | 1 | null;
  onEdit?: (quote: NoSoLong) => void;
  onDelete?: (quote: NoSoLong) => void;
}

const NoSoLongCard = ({
  quote,
  highlight = false,
  owned = false,
  onVote,
  disabled,
  userVoteOverride,
  onEdit,
  onDelete,
}: NoSoLongCardProps) => {
  const serverVote = quote.current_user_vote ?? null;
  const displayVote = userVoteOverride ?? serverVote ?? null;

  const voteButtonClass = (direction: "up" | "down") => {
    const classes = [direction === "up" ? "vote-button vote-button-up" : "vote-button vote-button-down"];
    if ((direction === "up" && displayVote === 1) || (direction === "down" && displayVote === -1)) {
      classes.push("vote-button-active");
    }
    return classes.join(" ");
  };

  const submitVote = (value: -1 | 0 | 1) => {
    if (disabled) return;
    onVote(quote.id, value);
  };

  const handleVoteToggle = (value: -1 | 1) => {
    const nextValue: -1 | 0 | 1 = displayVote === value ? 0 : value;
    submitVote(nextValue);
  };

  const handleEdit = () => {
    onEdit?.(quote);
  };

  const handleDelete = () => {
    onDelete?.(quote);
  };

  const cardClassNames = ["quote-card"];
  if (highlight) {
    cardClassNames.push("highlight");
  }
  if (owned) {
    cardClassNames.push("quote-card-owned");
  }

  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <article className={cardClassNames.join(" ")}>
      {!isTouch && (
        <span className="quote-chevron" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 9l4 4 4-4" stroke="#9aa0c2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      <p className="quote-text">“{quote.text}”</p>
      <div className="quote-meta">
        <span>— {getDisplayName(quote.user)}</span>
        {owned && <span className="quote-badge">Your recap</span>}
      </div>
      <div className="vote-controls">
        <button
          className={voteButtonClass("up")}
          onClick={() => handleVoteToggle(1)}
          disabled={disabled}
          aria-pressed={displayVote === 1}
        >
          <span className="vote-icon-large" aria-hidden="true">
            👍
          </span>
          <span className="vote-button-count">{quote.upvotes}</span>
        </button>
        <button
          className={voteButtonClass("down")}
          onClick={() => handleVoteToggle(-1)}
          disabled={disabled}
          aria-pressed={displayVote === -1}
        >
          <span className="vote-icon-large" aria-hidden="true">
            👎
          </span>
          <span className="vote-button-count">{quote.downvotes}</span>
        </button>
      </div>
      {owned && (
        <div className="owner-actions">
          <button type="button" className="ghost-button" onClick={handleEdit}>
            Edit recap
          </button>
          <button type="button" className="ghost-button ghost-button-danger" onClick={handleDelete}>
            Delete recap
          </button>
        </div>
      )}
    </article>
  );
};

export default NoSoLongCard;
