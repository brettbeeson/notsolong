import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Button, Stack, Typography, useMediaQuery, useTheme, type ButtonProps } from "@mui/material";

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  variant?: ButtonProps["variant"];
  fullWidth?: boolean;
  iconOnly?: boolean;
  size?: ButtonProps["size"];
  statusLabel?: string;
}

const NavigationButtons = ({
  onBack,
  onNext,
  disableBack,
  disableNext,
  variant = "contained",
  fullWidth = false,
  iconOnly = false,
  size = "large",
  statusLabel,
}: NavigationButtonsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showIconsOnly = iconOnly || isMobile;
  const buttonProps: Partial<ButtonProps> = {
    variant,
    size,
    color: "primary",
    fullWidth,
  };
  
  return (
    <Stack direction="row" spacing={1.5} flexGrow={fullWidth ? 1 : 0} alignItems="center">
      <Button
        {...buttonProps}
        onClick={onBack}
        disabled={disableBack}
        aria-label="Show previous title"
        startIcon={!showIconsOnly ? <ArrowBackRoundedIcon /> : undefined}
      >
        {showIconsOnly ? <ArrowBackRoundedIcon /> : "Prev"}
      </Button>
      {statusLabel && !showIconsOnly && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap", fontWeight: 600, minWidth: 110, textAlign: "center" }}
        >
          {statusLabel}
        </Typography>
      )}
      <Button
        {...buttonProps}
        onClick={onNext}
        disabled={disableNext}
        aria-label="Show next title"
        endIcon={!showIconsOnly ? <ArrowForwardRoundedIcon /> : undefined}
      >
        {showIconsOnly ? <ArrowForwardRoundedIcon /> : "Next"}
      </Button>
    </Stack>
  );
};

export default NavigationButtons;
