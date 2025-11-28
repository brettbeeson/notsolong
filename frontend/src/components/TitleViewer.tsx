import type { Recap, TitleBundle } from "../types/api";
import RecapCard from "./RecapCard";

interface TitleViewerProps {
  bundle: TitleBundle | null;
  loading: boolean;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  voteDisabledFor?: number | null;
  onAddRecap: () => void;
  userVotes: Record<number, -1 | 0 | 1 | undefined>;
  currentUserEmail?: string | null;
  onEditRecap: (quote: Recap) => void;
  onDeleteRecap: (quote: Recap) => void;
}

const TitleViewer = ({
  bundle,
  loading,
  onVote,
  voteDisabledFor,
  onAddRecap,
  userVotes,
  currentUserEmail,
  onEditRecap,
  onDeleteRecap,
}: TitleViewerProps) => {
  if (loading) {
    return <div className="panel">Loading a fresh Title...</div>;
  }

  if (!bundle) {
    return (
      <div className="panel empty-state">
        <p>No Titles yet. Be the first to add one!</p>
      </div>
    );
  }

  const { title, top_recap, other_recaps } = bundle;
  const authorName = title.author?.trim();
  const allQuotes: Recap[] = [top_recap, ...other_recaps].filter(Boolean) as Recap[];
  const userQuote = currentUserEmail
    ? allQuotes.find((quote) => quote.user.email === currentUserEmail)
    : null;
  const canAddRecap = !userQuote;
  const userOwnsTop = Boolean(top_recap && userQuote && userQuote.id === top_recap.id);

  const handlePrimaryCta = () => {
    if (userQuote) {
      onEditRecap(userQuote);
    } else {
      onAddRecap();
    }
  };

  return (
    <section className="panel title-viewer">
      <header className="title-header">
        <div className="title-header-copy">
          <p className="category">{title.category.toUpperCase()}</p>
          <div className="title-heading">
            <h1>{title.name}</h1>
          </div>
          {authorName && <p className="author">by {authorName}</p>}
        </div>
      </header>
      <div className="title-recaps">
        {top_recap ? (
          <>
            <div className="top-recap-stack">
              {userOwnsTop && <p className="top-recap-toast">Your recap is the best!</p>}
              <RecapCard
                quote={top_recap}
                highlight
                owned={userQuote?.id === top_recap.id}
                onVote={onVote}
                disabled={voteDisabledFor === top_recap.id}
                userVoteOverride={userVotes[top_recap.id] ?? null}
                onEdit={onEditRecap}
                onDelete={onDeleteRecap}
              />
            </div>
            {canAddRecap && (
              <div className="add-recap-inline">
                <button className="primary" onClick={handlePrimaryCta}>
                  Add your own
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No recaps yet!</p>
            {canAddRecap && (
              <button className="primary" onClick={handlePrimaryCta}>
                Add your own
              </button>
            )}
          </div>
        )}

        <div className="other-list">
          {other_recaps.map((item) => (
            <RecapCard
              key={item.id}
              quote={item}
              owned={userQuote?.id === item.id}
              onVote={onVote}
              disabled={voteDisabledFor === item.id}
              userVoteOverride={userVotes[item.id] ?? null}
              onEdit={onEditRecap}
              onDelete={onDeleteRecap}
            />
          ))}
          
        </div>
      </div>
    </section>
  );
};

export default TitleViewer;
