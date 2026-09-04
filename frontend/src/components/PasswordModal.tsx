import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const PasswordModal = ({
  isOpen,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onSubmit,
}: PasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match.');
      return;
    }

    await onSubmit(currentPassword, newPassword);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
      <button className="modal__backdrop" type="button" onClick={onClose} aria-label="Close password dialog" />

      <form className="modal__panel" onSubmit={handleSubmit}>
        <div className="modal__header">
          <div>
            <h2 id="password-modal-title" className="modal__title">
              Update password
            </h2>
            <p className="modal__subtitle">Enter your current password before setting a new one.</p>
          </div>

          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <label className="field">
          <span className="field__label">Current password</span>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">New password</span>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Confirm new password</span>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {localError || errorMessage ? (
          <div className="alert alert--error">
            <AlertCircle size={16} strokeWidth={1.75} />
            {localError ?? errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="alert alert--success">
            <CheckCircle2 size={16} strokeWidth={1.75} />
            {successMessage}
          </div>
        ) : null}

        <div className="modal__actions">
          <button className="btn btn--secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
};
