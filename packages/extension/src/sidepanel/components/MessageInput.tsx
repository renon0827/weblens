import { useState, useRef } from 'preact/hooks';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  hasElements?: boolean;
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'メッセージを入力...',
  hasElements = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && (message.trim() || hasElements);

  const handleSubmit = () => {
    if (canSend) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setMessage(target.value);

    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
  };

  return (
    <div class="message-input">
      <textarea
        ref={textareaRef}
        value={message}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <button
        class="btn-send"
        onClick={handleSubmit}
        disabled={!canSend}
      >
        送信
      </button>
    </div>
  );
}
