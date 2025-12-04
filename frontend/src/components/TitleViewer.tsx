import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect } from "react";

import type { Recap, TitleBundle } from "../types/api";
import RecapCard from "./RecapCard";

interface TitleViewerProps {
  bundle: TitleBundle | null;
  loading: boolean;
  activeRecap: Recap | null;
  recapIndex: number;
  recapCount: number;
  onVote: (quoteId: number, value: -1 | 0 | 1) => void;
  voteDisabledFor?: number | null;
  onAddRecap: () => void;
  userVotes: Record<number, -1 | 0 | 1 | undefined>;
  currentUserEmail?: string | null;
  onEditRecap: (quote: Recap) => void;
  onDeleteRecap: (quote: Recap) => void;
  onPromptAddTitle?: () => void;
  emptyCategoryLabel?: string | null;
  onNextRecap: () => void;
  onPreviousRecap: () => void;
  disableNextRecap: boolean;
  disablePreviousRecap: boolean;
}

const TitleViewer = ({
  bundle,
  loading,
  activeRecap,
  recapIndex,
  recapCount,
  onVote,
  voteDisabledFor,
  onAddRecap,
  userVotes,
  currentUserEmail,
  onEditRecap,
  onDeleteRecap,
  onPromptAddTitle,
  emptyCategoryLabel,
  onNextRecap,
  onPreviousRecap,
  disableNextRecap,
  disablePreviousRecap,
}: TitleViewerProps) => {
  useEffect(() => {
    if (!bundle && !loading) {
      onPromptAddTitle?.();
    }
  }, [bundle, loading, onPromptAddTitle]);

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography mt={2}>Loading a fresh Title...</Typography>
      </Paper>
    );
  }

  if (!bundle) {
    const noTitleMessage = emptyCategoryLabel && emptyCategoryLabel !== "All"
      ? `No ${emptyCategoryLabel.toLowerCase()} titles yet. Try another filter or add the first one!`
      : "No titles yet. Be the first to add one!";

    return (
      <Paper sx={{ p: 4 }}>
        <Typography>{noTitleMessage}</Typography>
      </Paper>
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
  const activeRecapId = activeRecap?.id ?? null;
  const activeIsTop = Boolean(activeRecap && top_recap && activeRecap.id === top_recap.id);
  const showTopAlert = activeIsTop && userOwnsTop;
  const recapProgressLabel = recapCount > 0 ? `Recap ${recapIndex + 1} of ${recapCount}` : "No recaps yet";

  const handlePrimaryCta = () => {
    if (userQuote) {
      onEditRecap(userQuote);
    } else {
      onAddRecap();
    }
  };

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: "100%", md: "auto" },
      }}
    >
      <Stack spacing={1.5} mb={3}>
        <Chip label={title.category.toUpperCase()} color="primary" variant="outlined" sx={{ width: "fit-content" }} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              {title.name}
            </Typography>
            {authorName && (
              <Typography variant="subtitle1" color="text.secondary">
                by {authorName}
              </Typography>
            )}
          </Box>
          {recapCount > 0 && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ width: "100%", display: { xs: "none", md: "flex" } }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackRoundedIcon fontSize="small" />}
                onClick={onPreviousRecap}
                disabled={disablePreviousRecap}
                aria-label="Previous recap"
              >
                Prev
              </Button>
              <Typography variant="body2" color="text.secondary">
                {recapProgressLabel}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                onClick={onNextRecap}
                disabled={disableNextRecap}
                aria-label="Next recap"
              >
                Next
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack spacing={3} sx={{ flexGrow: 1 }}>
        {activeRecap ? (
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            {showTopAlert && (
              <Alert icon={<EmojiEventsRoundedIcon fontSize="small" />} severity="success">
                Your recap is the best!
              </Alert>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <RecapCard
                quote={activeRecap}
                highlight={activeIsTop}
                owned={userQuote?.id === activeRecapId}
                onVote={onVote}
                disabled={voteDisabledFor === activeRecapId}
                userVoteOverride={activeRecapId ? userVotes[activeRecapId] ?? null : null}
                onEdit={onEditRecap}
                onDelete={onDeleteRecap}
              />
            </Box>
            {recapCount > 0 && (
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="center"
                sx={{ flexWrap: "wrap", display: { xs: "flex", md: "none" } }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackRoundedIcon fontSize="small" />}
                  onClick={onPreviousRecap}
                  disabled={disablePreviousRecap}
                  aria-label="Previous recap"
                >
                  Prev
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {recapProgressLabel}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                  onClick={onNextRecap}
                  disabled={disableNextRecap}
                  aria-label="Next recap"
                >
                  Next
                </Button>
              </Stack>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
            >
              {canAddRecap && (
                <Button
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                  onClick={handlePrimaryCta}
                  sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
                >
                  {userQuote ? "Edit your recap" : "Add your own"}
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <Box
            textAlign="center"
            py={4}
            sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <Typography>No recaps yet!</Typography>
            {canAddRecap && (
              <Button startIcon={<AddRoundedIcon />} variant="contained" sx={{ mt: 2 }} onClick={handlePrimaryCta}>
                Add your own
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default TitleViewer;
