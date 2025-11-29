import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { attentionPulse, slideBackward, slideForward } from "./theme/animations";

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
import { CATEGORY_OPTIONS } from "./constants/categories";

type PasswordResetParams = {
  uid: string;
  token: string;
  email?: string;
};

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
  const theme = useTheme();
  const isDesktopNavVisible = useMediaQuery(theme.breakpoints.up("md"));
  const borderStrong = theme.palette.grey[300];
  const surfaceColor = theme.palette.background.paper;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const safeAreaInsetBottom = "env(safe-area-inset-bottom, 0px)";
  const bottomBarOffset = `calc(96px + ${safeAreaInsetBottom})`;
  const { user, logout, updateProfile, refreshProfile } = useAuth();
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
  const addTitleHintTimer = useRef<number | null>(null);
  const [isSwipeCapable, setSwipeCapable] = useState<boolean>(() => detectSwipeCapability());
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const [isTitleAnimating, setTitleAnimating] = useState(false);
  const [isForwardExhausted, setForwardExhausted] = useState(false);
  const [resetParams, setResetParams] = useState<PasswordResetParams | null>(null);
  const [addTitleHintActive, setAddTitleHintActive] = useState(false);
  const [emptyCategory, setEmptyCategory] = useState<TitleCategory | "" | null>(null);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (!isAccountOpen || !isAuthenticated) {
      return;
    }
    void refreshProfile();
  }, [isAccountOpen, isAuthenticated, refreshProfile]);

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

  const dismissAddTitleHint = useCallback(() => {
    if (typeof window !== "undefined" && addTitleHintTimer.current !== null) {
      window.clearTimeout(addTitleHintTimer.current);
    }
    addTitleHintTimer.current = null;
    setAddTitleHintActive(false);
  }, []);

  const promptAddTitleHint = useCallback(() => {
    if (typeof window === "undefined") return;
    if (addTitleHintTimer.current !== null) {
      window.clearTimeout(addTitleHintTimer.current);
    }
    setAddTitleHintActive(true);
    addTitleHintTimer.current = window.setTimeout(() => {
      setAddTitleHintActive(false);
      addTitleHintTimer.current = null;
    }, 1800);
  }, []);

useEffect(() => () => {
  dismissAddTitleHint();
}, [dismissAddTitleHint]);

  const requireAuth = useCallback(() => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    return true;
  }, [user]);

  const handleCategoryChange = useCallback(
    (value: TitleCategory | "") => {
      setCategory(value);
      setMobileMenuOpen(false);
      setForwardExhausted(false);
      resetHistory();
      setEmptyCategory(null);
    },
    [resetHistory, setEmptyCategory]
  );

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
        setEmptyCategory(null);
        if (shouldReset) {
          resetHistory(normalized.title.id);
        } else {
          recordHistory(normalized.title.id);
        }
        
      } catch (err) {
        if (err instanceof NoTitlesAvailableError) {
          setBundle(null);
          // setError("No titles available. Add a new title.");
          resetHistory();
          setForwardExhausted(true);
          setEmptyCategory(category || "");
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    },
    [category, normalizeBundle, recordHistory, resetHistory, setEmptyCategory, syncVotesFromBundle]
  );

  const restartTitleFeed = useCallback(async () => {
    resetHistory();
    await loadRandom(true);
  }, [loadRandom, resetHistory]);

  const loadTitleSummary = useCallback(
    async (id: number, showSpinner = false) => {
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
        if (isAxiosError(err) && err.response?.status === 404) {
          setError(null);
          await restartTitleFeed();
        } else {
          setError(getErrorMessage(err));
        }
        return false;
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [normalizeBundle, restartTitleFeed, syncVotesFromBundle]
  );

  useEffect(() => {
    loadRandom(true);
  }, [loadRandom]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (hash.includes("?")) {
      const hashQuery = hash.split("?")[1] ?? "";
      const hashParams = new URLSearchParams(hashQuery);
      hashParams.forEach((value, key) => {
        if (!searchParams.has(key)) {
          searchParams.set(key, value);
        }
      });
    }
    const uid = searchParams.get("resetUid") ?? searchParams.get("uid");
    const token = searchParams.get("resetToken") ?? searchParams.get("token");
    if (uid && token) {
      const email = searchParams.get("resetEmail") ?? undefined;
      setResetParams({ uid, token, email: email || undefined });
      setAuthOpen(true);
      ["resetUid", "uid", "resetToken", "token", "resetEmail"].forEach((key) => {
        searchParams.delete(key);
      });
      const newSearch = searchParams.toString();
      const hashPath = hash.split("?")[0] ?? "";
      const nextUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${hashPath}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    if (!bundle?.title.id) return;
    setTitleAnimating(true);
    const timer = window.setTimeout(() => {
      setTitleAnimating(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [bundle?.title.id]);

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
    dismissAddTitleHint();
  }, [requireAuth, dismissAddTitleHint]);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const disableBackNav = !bundle || !canGoBack || loading;
  const disableNextNav = !bundle || loading || (!canGoForward && isForwardExhausted);
  const isOverlayOpen =
    isMobileMenuOpen || isRecapDialogOpen || isAddTitleOpen || isAuthOpen || isAccountOpen;
  const mobileMenuButtonAnimation = addTitleHintActive
    ? `${attentionPulse} 1.3s ease-out 2`
    : undefined;
  const emptyCategoryLabel =
    emptyCategory !== null
      ? CATEGORY_OPTIONS.find((option) => option.value === emptyCategory)?.label ?? "All"
      : null;
  const mobileContentPadding = `calc(4rem + 96px + ${safeAreaInsetBottom})`;
  const stageAnimation = isTitleAnimating
    ? `${transitionDirection === "backward" ? slideBackward : slideForward} 0.85s cubic-bezier(0.16, 1, 0.3, 1)`
    : undefined;
  
  return (
    <Container
      component="main"
      maxWidth="lg"
      disableGutters
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mx: "auto",
        py: { xs: "1.5rem", md: "2.5rem" },
        px: { xs: "1rem", sm: "clamp(1rem, 4vw, 3rem)" },
        pb: { xs: mobileContentPadding, md: "3rem" },
      }}
    >
      <Stack
        component="header"
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ gap: { xs: 1.5, md: 2 } }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" flexGrow={1} minWidth={0}>
          <Link
            href="/"
            underline="none"
            sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "inherit" }}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Not So Long logo"
              sx={{ width: 32, height: 32, borderRadius: 1 }}
            />
          </Link>
          <Stack spacing={0.5} minWidth={0}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: "1.5rem", md: "clamp(1.5rem, 3vw, 2.2rem)" },
                color: "#1d1f2e",
                lineHeight: 1.2,
              }}
            >
              Not So Long
            </Typography>
            <Typography
              variant="body2"
              component="p"
              sx={{
                color: textSecondary,
                display: { xs: "none", md: "block" },
                mb: 0,
              }}
            >
              Find the best recap: as short as possible, but no shorter!
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          {user ? (
            <UserMenu
              user={user}
              onAccount={() => setAccountOpen(true)}
              onLogout={logout}
              onAddTitle={handleAddTitleRequest}
              highlightAddTitle={addTitleHintActive}
            />
          ) : (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setAuthOpen(true)}
              sx={{
                backgroundColor: theme.palette.grey[200],
                borderColor: "transparent",
                borderRadius: "0.75rem",
                color: textPrimary,
                fontWeight: 600,
                px: 2.5,
                py: 0.75,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: borderStrong,
                  borderColor: "transparent",
                },
              }}
            >
              Log in
            </Button>
          )}
        </Stack>
        <IconButton
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            border: `1px solid ${borderStrong}`,
            backgroundColor: surfaceColor,
            borderRadius: "0.9rem",
            p: 1,
            color: textPrimary,
            animation: mobileMenuButtonAnimation,
            "&:hover": { backgroundColor: surfaceColor },
          }}
        >
          <MenuRoundedIcon />
        </IconButton>
      </Stack>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        user={user}
        onClose={closeMobileMenu}
        onOpenAccount={() => setAccountOpen(true)}
        onLogout={logout}
        onOpenAuth={() => setAuthOpen(true)}
        onAddTitle={handleAddTitleRequest}
      />

      <Box
        sx={{
          width: "100%",
          display: { xs: "none", md: "block" },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Box flexGrow={1} minWidth={0}>
            <CategoryFilter value={category} onChange={handleCategoryChange} />
          </Box>
          <Box flexShrink={0} ml={{ md: "auto" }}>
            <DesktopNavigation
              onBack={handleBack}
              onNext={handleNext}
              disableBack={disableBackNav}
              disableNext={disableNextNav}
            />
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          position: "relative",
          px: { xs: 0, md: "1.5rem" },
          display: "flex",
          justifyContent: "center",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={cancelSwipe}
        onPointerCancel={cancelSwipe}
      >
        <Box
          sx={{
            maxWidth: 960,
            width: "100%",
            mx: "auto",
            display: "flex",
            justifyContent: "center",
            willChange: "transform, opacity",
            animation: stageAnimation,
          }}
        >
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
            onPromptAddTitle={promptAddTitleHint}
            emptyCategoryLabel={emptyCategoryLabel}
          />
        </Box>
      </Box>
      {!isDesktopNavVisible && (
        <Box aria-hidden sx={{ height: bottomBarOffset, flexShrink: 0 }} />
      )}

      {!isDesktopNavVisible && !isOverlayOpen && (
        <BottomBar
          onBack={handleBack}
          onNext={handleNext}
          disableBack={disableBackNav}
          disableNext={disableNextNav}
          category={category}
          onCategoryChange={handleCategoryChange}
          nextExhausted={!canGoForward && isForwardExhausted}
        />
      )}

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
        onCreated={() => {
          setAddTitleOpen(false);
          void restartTitleFeed();
        }}
      />

      <AuthDialog
        open={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        resetParams={resetParams}
        onResetParamsCleared={() => setResetParams(null)}
      />

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
    </Container>
  );
}

export default App;
