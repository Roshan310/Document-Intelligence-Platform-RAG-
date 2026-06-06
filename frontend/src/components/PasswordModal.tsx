import { FormEvent, useEffect, useState } from 'react';

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
    <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
      <button className="password-modal__backdrop" type="button" onClick={onClose} aria-label="Close password dialog" />

      <form className="password-modal__panel" onSubmit={handleSubmit}>
        <div className="password-modal__header">
          <div>
            <h2 id="password-modal-title" className="password-modal__title">
              Update password
            </h2>
            <p className="password-modal__subtitle">Enter your current password before setting a new one.</p>
          </div>

          <button className="password-modal__close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <label className="password-modal__field">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="password-modal__field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="password-modal__field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {localError || errorMessage ? (
          <div className="password-modal__message password-modal__message--error">{localError ?? errorMessage}</div>
        ) : null}

        {successMessage ? (
          <div className="password-modal__message password-modal__message--success">{successMessage}</div>
        ) : null}

        <div className="password-modal__actions">
          <button className="password-modal__secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="password-modal__primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
};
