import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import "./App.css";
import {
  deleteRecap,
  fetchRandomTitle,
  fetchTitleSummary,
  NoTitlesAvailableError,
  voteRecap,
} from "./api/endpoints";
import AddRecapDialog from "./components/AddRecapDialog";
import AuthDialog from "./components/AuthDialog";
import AccountPanel from "./components/AccountPanel";
import CategoryFilter from "./components/CategoryFilter";
import NewTitleDialog from "./components/NewTitleDialog";
import TitleViewer from "./components/TitleViewer";
import UserMenu from "./components/UserMenu";
import MobileMenu from "./components/MobileMenu";
import BottomBar from "./components/BottomBar";
import DesktopNavigation from "./components/DesktopNavigation";
import { useAuth } from "./hooks/useAuth";
import { useHistoryStore } from "./store/useHistoryStore";
import type { Recap, TitleBundle, TitleCategory } from "./types/api";
import { getErrorMessage } from "./utils/errors";
import logoUrl from "./assets/favicon.ico";

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
  const [editingRecap, setEditingRecap] = useState<Recap | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const [isSwipeCapable, setSwipeCapable] = useState<boolean>(() => detectSwipeCapability());
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const [isTitleAnimating, setTitleAnimating] = useState(false);
  const [isForwardExhausted, setForwardExhausted] = useState(false);

  const normalizeBundle = useCallback((data: TitleBundle) => {
    const sortedOthers = [...data.other_recaps].sort((a, b) => {
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
      other_recaps: sortedOthers,
    };
  }, []);

  const syncVotesFromBundle = useCallback((data: TitleBundle) => {
    setUserVotes((prev) => {
      const next = { ...prev };
      const applyVote = (quote?: Recap | null) => {
        if (!quote) return;
        const vote = quote.current_user_vote;
        if (vote === 1 || vote === -1) {
          next[quote.id] = vote;
        } else {
          delete next[quote.id];
        }
      };
      applyVote(data.top_recap);
      data.other_recaps.forEach(applyVote);
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

  const handleCategoryChange = useCallback((value: TitleCategory | "") => {
    setCategory(value);
    setMobileMenuOpen(false);
    setForwardExhausted(false);
  }, []);

  const openCreateRecap = useCallback(() => {
    if (!requireAuth()) return;
    setEditingRecap(null);
    setRecapDialogOpen(true);
  }, [requireAuth]);

  const handleEditRecap = useCallback((quote: Recap) => {
    if (!requireAuth()) return;
    setEditingRecap(quote);
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
        setTransitionDirection("forward");
        const recentHistory = useHistoryStore.getState().items.slice(-20);
        const data = await fetchRandomTitle({
          category: category || undefined,
          exclude: recentHistory.length ? recentHistory : undefined,
        });
        if (!data) {
          setForwardExhausted(true);
          return; // exhausted deque, no-op per requirements
        }
        const normalized = normalizeBundle(data);
        setBundle(normalized);
        syncVotesFromBundle(normalized);
        setError(null);
        setForwardExhausted(false);
        if (shouldReset) {
          resetHistory(normalized.title.id);
        } else {
          recordHistory(normalized.title.id);
        }
        
      } catch (err) {
        if (err instanceof NoTitlesAvailableError) {
          setBundle(null);
          setError("No titles available. Add a new title.");
          resetHistory();
          setForwardExhausted(true);
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    },
    [category, normalizeBundle, recordHistory, resetHistory, syncVotesFromBundle]
  );

  useEffect(() => {
    loadRandom(true);
  }, [loadRandom]);

  useEffect(() => {
    if (!bundle?.title.id) return;
    setTitleAnimating(true);
    const timer = window.setTimeout(() => {
      setTitleAnimating(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [bundle?.title.id]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return undefined;
  }, [isMobileMenuOpen]);

  const handleNext = async () => {
    if (!canGoForward && isForwardExhausted) {
      return;
    }
    setTransitionDirection("forward");
    const forwardId = canGoForward ? historyItems[historyIndex + 1] : null;
    if (forwardId) {
      const success = await loadTitleSummary(forwardId, true);
      if (success) {
        setHistoryIndex(historyIndex + 1);
        setForwardExhausted(false);
      }
      return;
    }
    await loadRandom(false);
  };

  const handleBack = async () => {
    setTransitionDirection("backward");
    if (!canGoBack) return;
    const previousId = historyItems[historyIndex - 1];
    if (!previousId) return;
    const success = await loadTitleSummary(previousId, true);
    if (success) {
      setHistoryIndex(historyIndex - 1);
      setForwardExhausted(false);
    }
  };

  const handleVote = async (quoteId: number, value: -1 | 0 | 1) => {
    if (!bundle || !requireAuth()) return;
    setVoteTarget(quoteId);
    try {
      await voteRecap(quoteId, value);
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

  const handleDeleteRecap = useCallback(
    async (quote: Recap) => {
      if (!requireAuth()) return;
      // const confirmed = window.confirm("Delete your recap? This cannot be undone.");
      // if (!confirmed) return;
      try {
        await deleteRecap(quote.id);
        setEditingRecap((current) => {
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

  const baseStageClass = "title-viewer-stage";
  const stageAnimationClass = isTitleAnimating
    ? transitionDirection === "backward"
      ? "title-slide-backward"
      : "title-slide-forward"
    : "";
  const stageClassName = [baseStageClass, stageAnimationClass].filter(Boolean).join(" ");
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const disableBackNav = !bundle || !canGoBack || loading;
  const disableNextNav = !bundle || loading || (!canGoForward && isForwardExhausted);
  
  return (
    <div className="app-shell">
      <header className="app-header">
        
          <a href="/"><img className="app-logo" src={logoUrl} alt="Not So Long logo" /></a>
          <div className="app-title-group">
            <h1 className="app-title">Not So Long</h1>
            <p className="tagline">Find the best recap: as short as possible, but no shorter!</p>
          </div>
        <div className="auth-actions">
          {user ? (
            <UserMenu
              user={user}
              onAccount={() => setAccountOpen(true)}
              onLogout={logout}
              onAddTitle={handleAddTitleRequest}
            />
          ) : (
            <button className="secondary" onClick={() => setAuthOpen(true)}>
              Log in
            </button>
          )}
        </div>
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        user={user}
        onClose={closeMobileMenu}
        onOpenAccount={() => setAccountOpen(true)}
        onLogout={logout}
        onOpenAuth={() => setAuthOpen(true)}
        onAddTitle={handleAddTitleRequest}
        category={category}
        onCategoryChange={handleCategoryChange}
      />

      <div className="category-filter-desktop">
        <div className="filter-bar">
          <CategoryFilter
            value={category}
            onChange={handleCategoryChange}
          />
          <DesktopNavigation
            onBack={handleBack}
            onNext={handleNext}
            disableBack={disableBackNav}
            disableNext={disableNextNav}
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div
        className={stageClassName}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={cancelSwipe}
        onPointerCancel={cancelSwipe}
      >
        <div className="title-viewer-shell">
          <TitleViewer
            bundle={bundle}
            loading={loading}
            onVote={handleVote}
            voteDisabledFor={voteTarget}
            userVotes={userVotes}
            onAddRecap={openCreateRecap}
            currentUserEmail={user?.email ?? null}
            onEditRecap={handleEditRecap}
            onDeleteRecap={(quote) => {
              void handleDeleteRecap(quote);
            }}
          />
        </div>
      </div>

      <BottomBar
        onBack={handleBack}
        onNext={handleNext}
        disableBack={disableBackNav}
        disableNext={disableNextNav}
      />

      <AddRecapDialog
        open={isRecapDialogOpen}
        title={editingRecap?.title ?? bundle?.title ?? null}
        existingQuote={editingRecap}
        onClose={() => {
          setRecapDialogOpen(false);
          setEditingRecap(null);
        }}
        onCreated={async () => {
          await refreshActiveTitle();
          setEditingRecap(null);
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
