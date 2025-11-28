import type { Recap } from "../types/api";
import { getDisplayName } from "../utils/user";

interface RecapCardProps {
  quote: Recap;
  highlight?: boolean;
  owned?: boolean;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  disabled?: boolean;
  userVoteOverride?: -1 | 0 | 1 | null;
  onEdit?: (quote: Recap) => void;
  onDelete?: (quote: Recap) => void;
}

const RecapCard = ({
  quote,
  highlight = false,
  owned = false,
  onVote,
  disabled,
  userVoteOverride,
  onEdit,
  onDelete,
}: RecapCardProps) => {
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

  

  return (
    <article className={cardClassNames.join(" ")}>
      
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

export default RecapCard;
