import type { ElementInfo } from '../../shared/types';

interface ElementCardProps {
  element: ElementInfo;
  onRemove: (id: string) => void;
  onCommentChange: (id: string, comment: string) => void;
}

export function ElementCard({ element, onRemove, onCommentChange }: ElementCardProps) {
  const displayName = `${element.tagName}${element.id_attr ? `#${element.id_attr}` : ''}${
    element.className ? `.${element.className.split(' ')[0]}` : ''
  }`;

  return (
    <div class="element-card">
      <div class="element-card-header">
        {element.number && (
          <span class="element-number">{element.number}</span>
        )}
        <span class="element-name" title={element.selector}>
          {displayName}
        </span>
        <button
          class="btn-remove"
          onClick={() => onRemove(element.id)}
          title="削除"
        >
          ×
        </button>
      </div>
      <input
        type="text"
        class="element-comment"
        placeholder="コメントを追加..."
        value={element.comment}
        onInput={(e) => onCommentChange(element.id, (e.target as HTMLInputElement).value)}
      />
    </div>
  );
}
