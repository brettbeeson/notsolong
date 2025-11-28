import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
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
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography mt={2}>Loading a fresh Title...</Typography>
      </Paper>
    );
  }

  if (!bundle) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography>No Titles yet. Be the first to add one!</Typography>
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

  const handlePrimaryCta = () => {
    if (userQuote) {
      onEditRecap(userQuote);
    } else {
      onAddRecap();
    }
  };

  return (
    <Paper sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={1.5} mb={3}>
        <Chip label={title.category.toUpperCase()} color="primary" variant="outlined" sx={{ width: "fit-content" }} />
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {title.name}
        </Typography>
        {authorName && (
          <Typography variant="subtitle1" color="text.secondary">
            by {authorName}
          </Typography>
        )}
      </Stack>

      <Stack spacing={3}>
        {top_recap ? (
          <Stack spacing={2}>
            {userOwnsTop && (
              <Alert icon={<EmojiEventsRoundedIcon fontSize="small" />} severity="success">
                Your recap is the best!
              </Alert>
            )}
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
            {canAddRecap && (
              <Button
                startIcon={<AddRoundedIcon />}
                variant="contained"
                onClick={handlePrimaryCta}
                sx={{ alignSelf: "flex-start" }}
              >
                {userQuote ? "Edit your recap" : "Add your own"}
              </Button>
            )}
          </Stack>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography>No recaps yet!</Typography>
            {canAddRecap && (
              <Button startIcon={<AddRoundedIcon />} variant="contained" sx={{ mt: 2 }} onClick={handlePrimaryCta}>
                Add your own
              </Button>
            )}
          </Box>
        )}

        <Stack spacing={2}>
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
        </Stack>
      </Stack>
    </Paper>
  );
};

export default TitleViewer;
