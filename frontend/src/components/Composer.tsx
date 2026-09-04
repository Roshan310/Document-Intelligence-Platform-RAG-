import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

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
          placeholder="Ask a question about your documents..."
          disabled={disabled}
        />
      </label>

      <button
        className="composer__send-button"
        onClick={submitMessage}
        type="button"
        disabled={disabled}
        aria-label="Send message"
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  );
};
