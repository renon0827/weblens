import { ElementCard } from './ElementCard';
import type { ElementInfo } from '../../shared/types';

interface ElementListProps {
  elements: ElementInfo[];
  isSelecting: boolean;
  onStartSelection: () => void;
  onStopSelection: () => void;
  onRemoveElement: (id: string) => void;
  onCommentChange: (id: string, comment: string) => void;
}

export function ElementList({
  elements,
  isSelecting,
  onStartSelection,
  onStopSelection,
  onRemoveElement,
  onCommentChange,
}: ElementListProps) {
  return (
    <div class="element-list">
      <div class="element-list-header">
        <span>選択中の要素 ({elements.length})</span>
      </div>

      {elements.length > 0 && (
        <div class="element-cards">
          {elements.map((elem) => (
            <ElementCard
              key={elem.id}
              element={elem}
              onRemove={onRemoveElement}
              onCommentChange={onCommentChange}
            />
          ))}
        </div>
      )}

      <button
        class={`btn-select ${isSelecting ? 'selecting' : ''}`}
        onClick={isSelecting ? onStopSelection : onStartSelection}
      >
        {isSelecting ? '選択を終了 (Esc)' : '要素を選択'}
      </button>
    </div>
  );
}
