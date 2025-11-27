import type { NoSoLong, TitleBundle } from "../types/api";
import NoSoLongCard from "./NoSoLongCard";

interface TitleViewerProps {
  bundle: TitleBundle | null;
  loading: boolean;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  voteDisabledFor?: number | null;
  onAddNoSoLong: () => void;
  userVotes: Record<number, -1 | 0 | 1 | undefined>;
  currentUserEmail?: string | null;
  onEditNoSoLong: (quote: NoSoLong) => void;
  onDeleteNoSoLong: (quote: NoSoLong) => void;
  showNavigation: boolean;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  isForwardExhausted: boolean;
}

const TitleViewer = ({
  bundle,
  loading,
  onVote,
  voteDisabledFor,
  onAddNoSoLong,
  userVotes,
  currentUserEmail,
  onEditNoSoLong,
  onDeleteNoSoLong,
  showNavigation,
  onBack,
  onNext,
  canGoBack,
  canGoForward,
  isForwardExhausted,
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

  const { title, top_nosolong, other_nosolongs } = bundle;
  const authorName = title.author?.trim();
  const allQuotes: NoSoLong[] = [top_nosolong, ...other_nosolongs].filter(Boolean) as NoSoLong[];
  const userQuote = currentUserEmail
    ? allQuotes.find((quote) => quote.user.email === currentUserEmail)
    : null;
  const canAddRecap = !userQuote;
  const userOwnsTop = Boolean(top_nosolong && userQuote && userQuote.id === top_nosolong.id);

  const handlePrimaryCta = () => {
    if (userQuote) {
      onEditNoSoLong(userQuote);
    } else {
      onAddNoSoLong();
    }
  };

  return (
    <section className="panel title-viewer">
      <header className="title-header">
        <div className="title-header-copy">
          <p className="category">{title.category.toUpperCase()}</p>
          <div className="title-heading">
            <h1>{title.name}</h1>
            {showNavigation && (
              <div className="title-nav-controls" aria-label="Title navigation controls">
                <button
                  type="button"
                  className="title-nav-button"
                  onClick={onBack}
                  disabled={!canGoBack || loading}
                  aria-label="Show previous title"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="title-nav-button"
                  onClick={onNext}
                  disabled={loading || (!canGoForward && isForwardExhausted)}
                  aria-label="Show next title"
                >
                  →
                </button>
              </div>
            )}
          </div>
          {authorName && <p className="author">by {authorName}</p>}
        </div>
      </header>
      <div className="title-recaps">
        {top_nosolong ? (
          <>
            <div className="top-recap-stack">
              {userOwnsTop && <p className="top-recap-toast">Your recap is the best!</p>}
              <NoSoLongCard
                quote={top_nosolong}
                highlight
                owned={userQuote?.id === top_nosolong.id}
                onVote={onVote}
                disabled={voteDisabledFor === top_nosolong.id}
                userVoteOverride={userVotes[top_nosolong.id] ?? null}
                onEdit={onEditNoSoLong}
                onDelete={onDeleteNoSoLong}
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
            <p>No recaps yet. Add yours!</p>
            {canAddRecap && (
              <button className="primary" onClick={handlePrimaryCta}>
                Add your recap
              </button>
            )}
          </div>
        )}

        <div className="other-list">
          {other_nosolongs.map((item) => (
            <NoSoLongCard
              key={item.id}
              quote={item}
              owned={userQuote?.id === item.id}
              onVote={onVote}
              disabled={voteDisabledFor === item.id}
              userVoteOverride={userVotes[item.id] ?? null}
              onEdit={onEditNoSoLong}
              onDelete={onDeleteNoSoLong}
            />
          ))}
          
        </div>
      </div>
    </section>
  );
};

export default TitleViewer;
