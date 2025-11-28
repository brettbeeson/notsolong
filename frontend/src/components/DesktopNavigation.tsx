import NavigationButtons from "./NavigationButtons";

interface DesktopNavigationProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
}

const DesktopNavigation = ({ onBack, onNext, disableBack, disableNext }: DesktopNavigationProps) => {
  return (
    <div className="desktop-nav-controls" role="toolbar" aria-label="Desktop navigation controls">
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        disableBack={disableBack}
        disableNext={disableNext}
        buttonClassName="desktop-nav-button"
      />
    </div>
  );
};

export default DesktopNavigation;
