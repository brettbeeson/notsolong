import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import "./App.css";
import { deleteNoSoLong, fetchRandomTitle, fetchTitleSummary, voteNoSoLong } from "./api/endpoints";
import AddNoSoLongDialog from "./components/AddNoSoLongDialog";
import AuthDialog from "./components/AuthDialog";
import AccountPanel from "./components/AccountPanel";
import CategoryFilter from "./components/CategoryFilter";
import NewTitleDialog from "./components/NewTitleDialog";
import TitleViewer from "./components/TitleViewer";
import UserMenu from "./components/UserMenu";
import { useAuth } from "./hooks/useAuth";
import { useHistoryStore } from "./store/useHistoryStore";
import type { NoSoLong, TitleBundle, TitleCategory } from "./types/api";
import { getErrorMessage } from "./utils/errors";

const detectSwipeCapability = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const hasTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints > 0 : false;
  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

  return hasTouchPoints || coarsePointer;
};

function App() {
  const { user, logout, updateProfile } = useAuth();
  const historyIndex = useHistoryStore((state) => state.index);
  const historyItems = useHistoryStore((state) => state.items);
  const recordHistory = useHistoryStore((state) => state.record);
  const setHistoryIndex = useHistoryStore((state) => state.setIndex);
  const resetHistory = useHistoryStore((state) => state.reset);
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < historyItems.length - 1;

  const [category, setCategory] = useState<TitleCategory | "">("");
  const [bundle, setBundle] = useState<TitleBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteTarget, setVoteTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecapDialogOpen, setRecapDialogOpen] = useState(false);
  const [isAddTitleOpen, setAddTitleOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, -1 | 0 | 1 | undefined>>({});
  const [editingQuote, setEditingQuote] = useState<NoSoLong | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const [isSwipeCapable, setSwipeCapable] = useState<boolean>(() => detectSwipeCapability());

  const normalizeBundle = useCallback((data: TitleBundle) => {
    const sortedOthers = [...data.other_nosolongs].sort((a, b) => {
      const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      const upvoteDelta = (b.upvotes ?? 0) - (a.upvotes ?? 0);
      if (upvoteDelta !== 0) {
        return upvoteDelta;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return {
      ...data,
      other_nosolongs: sortedOthers,
    };
  }, []);

  const syncVotesFromBundle = useCallback((data: TitleBundle) => {
    setUserVotes((prev) => {
      const next = { ...prev };
      const applyVote = (quote?: NoSoLong | null) => {
        if (!quote) return;
        const vote = quote.current_user_vote;
        if (vote === 1 || vote === -1) {
          next[quote.id] = vote;
        } else {
          delete next[quote.id];
        }
      };
      applyVote(data.top_nosolong);
      data.other_nosolongs.forEach(applyVote);
      return next;
    });
  }, []);

  const setLocalUserVote = useCallback((quoteId: number, value: -1 | 0 | 1) => {
    setUserVotes((prev) => {
      const next = { ...prev };
      if (value === 0) {
        delete next[quoteId];
      } else {
        next[quoteId] = value;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateCapability = () => setSwipeCapable(detectSwipeCapability());

    updateCapability();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateCapability);
      return () => mediaQuery.removeEventListener("change", updateCapability);
    }

    mediaQuery.addListener(updateCapability);
    return () => mediaQuery.removeListener(updateCapability);
  }, []);

  const requireAuth = useCallback(() => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    return true;
  }, [user]);

  const openCreateRecap = useCallback(() => {
    if (!requireAuth()) return;
    setEditingQuote(null);
    setRecapDialogOpen(true);
  }, [requireAuth]);

  const handleEditNoSoLong = useCallback((quote: NoSoLong) => {
    if (!requireAuth()) return;
    setEditingQuote(quote);
    setRecapDialogOpen(true);
  }, [requireAuth]);

  const loadTitleSummary = useCallback(async (id: number, showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const data = await fetchTitleSummary(id);
      const normalized = normalizeBundle(data);
      setBundle(normalized);
      syncVotesFromBundle(normalized);
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [normalizeBundle, syncVotesFromBundle]);

  const loadRandom = useCallback(
    async (shouldReset = false) => {
      setLoading(true);
      try {
        const data = await fetchRandomTitle(category || undefined);
        const normalized = normalizeBundle(data);
        setBundle(normalized);
        syncVotesFromBundle(normalized);
        setError(null);
        if (shouldReset) {
          resetHistory(normalized.title.id);
        } else {
          recordHistory(normalized.title.id);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [category, normalizeBundle, recordHistory, resetHistory, syncVotesFromBundle]
  );

  useEffect(() => {
    loadRandom(true);
  }, [loadRandom]);

  const handleNext = async () => {
    const forwardId = canGoForward ? historyItems[historyIndex + 1] : null;
    if (forwardId) {
      const success = await loadTitleSummary(forwardId, true);
      if (success) {
        setHistoryIndex(historyIndex + 1);
      }
      return;
    }
    await loadRandom(false);
  };

  const handleBack = async () => {
    if (!canGoBack) return;
    const previousId = historyItems[historyIndex - 1];
    if (!previousId) return;
    const success = await loadTitleSummary(previousId, true);
    if (success) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleVote = async (quoteId: number, value: -1 | 0 | 1) => {
    if (!bundle || !requireAuth()) return;
    setVoteTarget(quoteId);
    try {
      await voteNoSoLong(quoteId, value);
      setLocalUserVote(quoteId, value);
      await loadTitleSummary(bundle.title.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVoteTarget(null);
    }
  };

  const refreshActiveTitle = useCallback(async () => {
    if (!bundle) return;
    await loadTitleSummary(bundle.title.id, true);
  }, [bundle, loadTitleSummary]);

  const handleDeleteNoSoLong = useCallback(
    async (quote: NoSoLong) => {
      if (!requireAuth()) return;
      // const confirmed = window.confirm("Delete your recap? This cannot be undone.");
      // if (!confirmed) return;
      try {
        await deleteNoSoLong(quote.id);
        setEditingQuote((current) => {
          if (current?.id === quote.id) {
            setRecapDialogOpen(false);
            return null;
          }
          return current;
        });
        await refreshActiveTitle();
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [refreshActiveTitle, requireAuth]
  );

  const handleAddTitleRequest = useCallback(() => {
    if (!requireAuth()) return;
    setAddTitleOpen(true);
  }, [requireAuth]);

  const beginSwipe = (clientX: number, target: EventTarget | null) => {
    if (!isSwipeCapable) return;
    if (loading) return;
    if (target instanceof HTMLElement) {
      if (target.closest("button, a, textarea, input, select")) {
        return;
      }
    }
    swipeStartX.current = clientX;
  };

  const endSwipe = (clientX: number) => {
    if (!isSwipeCapable) return;
    if (swipeStartX.current === null) return;
    const delta = clientX - swipeStartX.current;
    swipeStartX.current = null;
    const threshold = 60;
    if (Math.abs(delta) < threshold) return;
    if (delta < 0) {
      void handleNext();
    } else if (canGoBack) {
      void handleBack();
    }
  };

  const cancelSwipe = () => {
    if (!isSwipeCapable) return;
    swipeStartX.current = null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isSwipeCapable) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    beginSwipe(event.clientX, event.target);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isSwipeCapable) return;
    if (event.pointerType === "mouse" && event.button !== 0 && swipeStartX.current === null) return;
    endSwipe(event.clientX);
  };

  const showChevrons = !isSwipeCapable;
  const stageClassName = showChevrons ? "title-viewer-stage title-viewer-stage-chevrons" : "title-viewer-stage";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Not So Long</h1>
          <p>Recaps that are not so long.</p>
        </div>
        <div className="auth-actions">
          {user ? (
            <UserMenu
              user={user}
              onAccount={() => setAccountOpen(true)}
              onLogout={logout}
            />
          ) : (
            <button className="secondary" onClick={() => setAuthOpen(true)}>
              Log in
            </button>
          )}
        </div>
      </header>

      <CategoryFilter
        value={category}
        onChange={(value) => setCategory(value)}
      />

      {error && <div className="error-banner">{error}</div>}

      <div
        className={stageClassName}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={cancelSwipe}
        onPointerCancel={cancelSwipe}
      >
        {showChevrons && (
          <div className="chevron-wrapper">
            <button
              type="button"
              className="edge-chevron edge-chevron-prev"
              onClick={handleBack}
              disabled={!canGoBack || loading}
              aria-label="Show previous title"
            >
              ←
            </button>
          </div>
        )}

        <div className="title-viewer-shell">
          <TitleViewer
            bundle={bundle}
            loading={loading}
            onVote={handleVote}
            voteDisabledFor={voteTarget}
            userVotes={userVotes}
            onAddNoSoLong={openCreateRecap}
            onAddTitle={handleAddTitleRequest}
            currentUserEmail={user?.email ?? null}
            onEditNoSoLong={handleEditNoSoLong}
            onDeleteNoSoLong={(quote) => {
              void handleDeleteNoSoLong(quote);
            }}
          />
        </div>

        {showChevrons && (
          <div className="chevron-wrapper">
            <button
              type="button"
              className="edge-chevron edge-chevron-next"
              onClick={handleNext}
              disabled={loading}
              aria-label="Show next title"
            >
              →
            </button>
          </div>
        )}
      </div>

      <AddNoSoLongDialog
        open={isRecapDialogOpen}
        title={editingQuote?.title ?? bundle?.title ?? null}
        existingQuote={editingQuote}
        onClose={() => {
          setRecapDialogOpen(false);
          setEditingQuote(null);
        }}
        onCreated={async () => {
          await refreshActiveTitle();
          setEditingQuote(null);
          setRecapDialogOpen(false);
        }}
      />

      <NewTitleDialog
        open={isAddTitleOpen}
        onClose={() => setAddTitleOpen(false)}
        onCreated={(newBundle) => {
          const normalized = normalizeBundle(newBundle);
          setBundle(normalized);
          syncVotesFromBundle(normalized);
          resetHistory(normalized.title.id);
          setAddTitleOpen(false);
        }}
      />

      <AuthDialog open={isAuthOpen} onClose={() => setAuthOpen(false)} />

      {isAccountOpen && user && (
        <AccountPanel
          open={isAccountOpen}
          user={user}
          onClose={() => setAccountOpen(false)}
          onSave={async (payload) => {
            await updateProfile(payload);
          }}
        />
      )}
    </div>
  );
}

export default App;
