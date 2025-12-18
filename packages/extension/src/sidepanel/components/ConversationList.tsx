import { useState, useRef, useEffect } from 'preact/hooks';
import type { Conversation } from '../../shared/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onCreate,
  onUpdateTitle,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (conv: Conversation, e: MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const handleSaveTitle = (id: string) => {
    if (editValue.trim()) {
      onUpdateTitle(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div class="conversation-list">
      <div class="conversation-list-header">
        <span>会話一覧</span>
        <button class="btn-new" onClick={onCreate} title="新規会話">
          + 新規会話
        </button>
      </div>
      <div class="conversation-items">
        {conversations.length === 0 ? (
          <div class="conversation-empty">会話がありません</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              class={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div class="conversation-info">
                {editingId === conv.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    class="conversation-title-input"
                    value={editValue}
                    onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
                    onBlur={() => handleSaveTitle(conv.id)}
                    onKeyDown={(e) => handleKeyDown(e, conv.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    class="conversation-title"
                    onDblClick={(e) => handleDoubleClick(conv, e)}
                    title="ダブルクリックで編集"
                  >
                    {conv.title}
                  </span>
                )}
                <span class="conversation-date">{formatDate(conv.updatedAt)}</span>
              </div>
              <button
                class="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                title="削除"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
