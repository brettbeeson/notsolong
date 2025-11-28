import { Paper } from "@mui/material";
import NavigationButtons from "./NavigationButtons";

interface BottomBarProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
}

const BottomBar = ({ onBack, onNext, disableBack, disableNext }: BottomBarProps) => {
  return (
    <Paper
      role="toolbar"
      aria-label="Mobile navigation bar"
      elevation={12}
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        width: "min(520px, calc(100% - 1.5rem))",
        padding: 1,
        borderRadius: 4,
        backdropFilter: "blur(18px)",
        backgroundColor: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(63, 42, 252, 0.08)",
        boxShadow: "0 10px 26px rgba(15,13,36,0.22)",
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        disableBack={disableBack}
        disableNext={disableNext}
        fullWidth
        iconOnly
        variant="outlined"
      />
    </Paper>
  );
};

export default BottomBar;
