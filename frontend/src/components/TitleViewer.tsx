import type { NoSoLong, TitleBundle } from "../types/api";
import NoSoLongCard from "./NoSoLongCard";

interface TitleViewerProps {
  bundle: TitleBundle | null;
  loading: boolean;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  voteDisabledFor?: number | null;
  onAddNoSoLong: () => void;
  onAddTitle: () => void;
  userVotes: Record<number, -1 | 0 | 1 | undefined>;
  currentUserEmail?: string | null;
  onEditNoSoLong: (quote: NoSoLong) => void;
  onDeleteNoSoLong: (quote: NoSoLong) => void;
}

const TitleViewer = ({
  bundle,
  loading,
  onVote,
  voteDisabledFor,
  onAddNoSoLong,
  onAddTitle,
  userVotes,
  currentUserEmail,
  onEditNoSoLong,
  onDeleteNoSoLong,
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
        <div>
          <p className="category">{title.category.toUpperCase()}</p>
          <h1>{title.name}</h1>
          {authorName && <p className="author">by {authorName}</p>}
        </div>
        <div className="title-header-actions">
          <div className="cta-group">
            <button className="secondary button-medium" onClick={onAddTitle}>
            +&nbsp;Title
            </button>
            
            {!userQuote && (
            
            
            <button className="primary button-medium" onClick={handlePrimaryCta}>
              +&nbsp;Recap
            </button>
            )}
            
          </div>
          
        </div>
      </header>
      <div className="title-recaps">
        {top_nosolong ? (
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
        ) : (
          <div className="empty-state">
            <p>No recaps yet. Add yours!</p>
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
