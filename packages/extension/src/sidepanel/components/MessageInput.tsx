import { useState, useRef } from 'preact/hooks';
import type { FileAttachment } from '../../shared/types';
import { FileBrowser } from './FileBrowser';

interface MessageInputProps {
  onSend: (message: string, attachments: FileAttachment[]) => void;
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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && (message.trim() || hasElements || attachments.length > 0);

  const handleSubmit = () => {
    if (canSend) {
      onSend(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
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

  const handleFileSelect = (paths: string[]) => {
    setAttachments(prev => [...prev, ...paths]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Get filename from path
  const getFileName = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  return (
    <div class="message-input-container">
      {attachments.length > 0 && (
        <div class="attachments-preview">
          {attachments.map((path, index) => (
            <div key={index} class="attachment-item">
              <span class="attachment-icon">📄</span>
              <span class="attachment-name" title={path}>{getFileName(path)}</span>
              <button
                class="btn-remove-attachment"
                onClick={() => handleRemoveAttachment(index)}
                title="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div class="message-input">
        <button
          class="btn-attach"
          onClick={() => setShowFileBrowser(true)}
          disabled={disabled}
          title="ファイルを添付"
        >
          📎
        </button>
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

      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelect={handleFileSelect}
        multiple={true}
      />
    </div>
  );
}
