interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  buttonClassName?: string;
  showSpacer?: boolean;
}

const NavigationButtons = ({
  onBack,
  onNext,
  disableBack,
  disableNext,
  buttonClassName = "bottom-bar-button",
  showSpacer = false,
}: NavigationButtonsProps) => {
  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={onBack}
        disabled={disableBack}
        aria-label="Show previous title"
      >
        <span aria-hidden="true">←</span>
      </button>
      {showSpacer && <div className="bottom-bar-spacer" aria-hidden="true" />}
      <button
        type="button"
        className={buttonClassName}
        onClick={onNext}
        disabled={disableNext}
        aria-label="Show next title"
      >
        <span aria-hidden="true">→</span>
      </button>
    </>
  );
};

export default NavigationButtons;
