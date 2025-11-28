import NavigationButtons from "./NavigationButtons";

interface BottomBarProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
}

const BottomBar = ({ onBack, onNext, disableBack, disableNext }: BottomBarProps) => {
  return (
    <div className="bottom-bar" role="toolbar" aria-label="Mobile navigation bar">
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        disableBack={disableBack}
        disableNext={disableNext}
        showSpacer
      />
    </div>
  );
};

export default BottomBar;
