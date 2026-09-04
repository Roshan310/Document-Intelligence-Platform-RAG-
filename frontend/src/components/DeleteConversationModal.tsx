import { useEffect } from 'react';
import { AlertCircle, Loader2, Trash2, X } from 'lucide-react';

interface DeleteConversationModalProps {
  conversationTitle: string | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConversationModal = ({
  conversationTitle,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteConversationModalProps) => {
  useEffect(() => {
    if (!conversationTitle) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversationTitle, isDeleting, onClose]);

  if (!conversationTitle) {
    return null;
  }

  return (
    <div
      className="modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-conversation-title"
      aria-describedby="delete-conversation-description"
    >
      <button
        className="modal__backdrop"
        type="button"
        onClick={onClose}
        disabled={isDeleting}
        aria-label="Close delete conversation dialog"
      />

      <div className="modal__panel modal__panel--compact">
        <div className="modal__header">
          <div className="modal__danger-heading">
            <span className="modal__danger-icon" aria-hidden="true">
              <Trash2 size={18} strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="delete-conversation-title" className="modal__title">
                Delete conversation?
              </h2>
              <p id="delete-conversation-description" className="modal__subtitle">
                This will permanently remove the conversation and all of its messages.
              </p>
            </div>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal__conversation-name">{conversationTitle}</div>

        {errorMessage ? (
          <div className="alert alert--error" role="alert">
            <AlertCircle size={16} strokeWidth={1.75} />
            {errorMessage}
          </div>
        ) : null}

        <div className="modal__actions">
          <button
            className="btn btn--secondary"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            autoFocus
          >
            Cancel
          </button>
          <button className="btn btn--danger" type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 size={16} strokeWidth={1.75} className="spinner" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={16} strokeWidth={1.75} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
