interface NavigationButtonsProps {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  disabled?: boolean;
  variant?: "inline" | "side";
}

const NavigationButtons = ({ onNext, onBack, canGoBack, disabled, variant = "inline" }: NavigationButtonsProps) => {
  if (variant === "side") {
    return (
      <div className="nav-buttons-side">
        <button
          type="button"
          className="nav-arrow nav-arrow-prev"
          onClick={onBack}
          disabled={!canGoBack || disabled}
          aria-label="Show previous title"
        >
          ←
        </button>
        <button
          type="button"
          className="nav-arrow nav-arrow-next"
          onClick={onNext}
          disabled={disabled}
          aria-label="Show next title"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <div className="nav-buttons">
      <button className="primary" onClick={onBack} disabled={!canGoBack || disabled}>
        ← Prev
      </button>
      <button className="primary" onClick={onNext} disabled={disabled}>
        Next →
      </button>
    </div>
  );
};

export default NavigationButtons;
