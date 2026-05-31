import { useState } from 'react';

interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const Composer = ({ onSend, disabled = false }: ComposerProps) => {
  const [value, setValue] = useState('');

  const submitMessage = () => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    onSend(trimmedValue);
    setValue('');
  };

  return (
    <div className="composer">
      <div className="composer__row">
        <label className="composer__field">
          <span className="sr-only">Type your message</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            type="text"
            placeholder="Message the assistant..."
            disabled={disabled}
          />
        </label>

        <button
          className="composer__send-button"
          onClick={submitMessage}
          type="button"
          disabled={disabled}
        >
          🡲
        </button>
      </div>
    </div>
  );
};