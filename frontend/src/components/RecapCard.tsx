import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

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
  const theme = useTheme();
  const serverVote = quote.current_user_vote ?? null;
  const displayVote = userVoteOverride ?? serverVote ?? null;

  const submitVote = (value: -1 | 0 | 1) => {
    if (disabled) return;
    onVote(quote.id, value);
  };

  const handleVoteToggle = (value: -1 | 1) => {
    const nextValue: -1 | 0 | 1 = displayVote === value ? 0 : value;
    submitVote(nextValue);
  };

  return (
    <Card
      variant={highlight ? "outlined" : undefined}
      sx={{
        borderColor: highlight ? theme.palette.primary.main : undefined,
        backgroundColor: highlight ? "rgba(63, 42, 252, 0.05)" : undefined,
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Typography variant="h6" gutterBottom>
          “{quote.text}”
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" color="text.secondary">
            — {getDisplayName(quote.user)}
          </Typography>
          {owned && <Chip size="small" color="secondary" label="Your recap" />}
        </Stack>
      </CardContent>
      <CardActions
        sx={{
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          px: { xs: 2.25, md: 3 },
          pb: { xs: 2.25, md: 3 },
        }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant={displayVote === 1 ? "contained" : "outlined"}
            startIcon={<ThumbUpAltRoundedIcon />}
            onClick={() => handleVoteToggle(1)}
            disabled={disabled}
          >
            {quote.upvotes}
          </Button>
          <Button
            variant={displayVote === -1 ? "contained" : "outlined"}
            color="error"
            startIcon={<ThumbDownAltRoundedIcon />}
            onClick={() => handleVoteToggle(-1)}
            disabled={disabled}
          >
            {quote.downvotes}
          </Button>
        </Stack>
        {owned && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="text" startIcon={<EditRoundedIcon />} onClick={() => onEdit?.(quote)}>
              Edit
            </Button>
            <Button
              variant="text"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => onDelete?.(quote)}
            >
              Delete
            </Button>
          </Stack>
        )}
      </CardActions>
    </Card>
  );
};

export default RecapCard;
