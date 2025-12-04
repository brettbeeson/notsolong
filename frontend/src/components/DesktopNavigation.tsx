import { Stack } from "@mui/material";
import NavigationButtons from "./NavigationButtons";

interface DesktopNavigationProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  statusLabel?: string | null;
}

const DesktopNavigation = ({ onBack, onNext, disableBack, disableNext, statusLabel }: DesktopNavigationProps) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1} role="toolbar" aria-label="Desktop navigation controls">
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        disableBack={disableBack}
        disableNext={disableNext}
        variant="outlined"
        size="medium"
        statusLabel={statusLabel ?? undefined}
      />
    </Stack>
  );
};

export default DesktopNavigation;
