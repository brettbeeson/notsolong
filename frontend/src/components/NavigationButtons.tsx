import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Button, Stack, type ButtonProps } from "@mui/material";

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  variant?: ButtonProps["variant"];
  fullWidth?: boolean;
  iconOnly?: boolean;
  size?: ButtonProps["size"];
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
}: NavigationButtonsProps) => {
  const buttonProps: Partial<ButtonProps> = {
    variant,
    size,
    color: "primary",
    fullWidth,
  };

  return (
    <Stack direction="row" spacing={1} flexGrow={fullWidth ? 1 : 0} alignItems="center">
      <Button
        {...buttonProps}
        onClick={onBack}
        disabled={disableBack}
        aria-label="Show previous title"
        startIcon={!iconOnly ? <ArrowBackRoundedIcon /> : undefined}
      >
        {iconOnly ? <ArrowBackRoundedIcon /> : "Previous"}
      </Button>
      <Button
        {...buttonProps}
        onClick={onNext}
        disabled={disableNext}
        aria-label="Show next title"
        endIcon={!iconOnly ? <ArrowForwardRoundedIcon /> : undefined}
      >
        {iconOnly ? <ArrowForwardRoundedIcon /> : "Next"}
      </Button>
    </Stack>
  );
};

export default NavigationButtons;
