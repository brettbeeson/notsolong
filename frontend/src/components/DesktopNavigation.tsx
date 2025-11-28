import { Stack } from "@mui/material";
import NavigationButtons from "./NavigationButtons";

interface DesktopNavigationProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
}

const DesktopNavigation = ({ onBack, onNext, disableBack, disableNext }: DesktopNavigationProps) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1} role="toolbar" aria-label="Desktop navigation controls">
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        disableBack={disableBack}
        disableNext={disableNext}
        variant="outlined"
        size="medium"
      />
    </Stack>
  );
};

export default DesktopNavigation;
