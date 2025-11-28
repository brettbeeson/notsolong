import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) {
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="modal-panel" onClick={stopPropagation}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
        {title ? (
          <div className="modal-header">
            <h2>{title}</h2>
          </div>
        ) : null}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
