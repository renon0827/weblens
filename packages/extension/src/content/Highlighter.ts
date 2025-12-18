export interface HighlightOptions {
  isSelected?: boolean;
}

const HIGHLIGHT_CLASS = 'weblens-highlight';
const LABEL_CLASS = 'weblens-label';
const SELECTED_CLASS = 'weblens-selected';

export class Highlighter {
  private currentHighlight: HTMLElement | null = null;
  private currentLabel: HTMLElement | null = null;
  private selectedElements: Map<string, { element: Element; highlight: HTMLElement; label: HTMLElement; number: number }> =
    new Map();
  private nextNumber = 1;

  highlightElement(element: Element | null, options: HighlightOptions = {}): void {
    this.clearHover();

    if (!element || options.isSelected) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Create highlight overlay
    this.currentHighlight = document.createElement('div');
    this.currentHighlight.className = HIGHLIGHT_CLASS;
    this.currentHighlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 2147483646;
      box-sizing: border-box;
    `;

    // Create label
    const tagName = element.tagName.toLowerCase();
    const className =
      element.className && typeof element.className === 'string'
        ? `.${element.className.trim().split(/\s+/).join('.')}`
        : '';
    const labelText = `${tagName}${className}`;

    this.currentLabel = document.createElement('div');
    this.currentLabel.className = LABEL_CLASS;
    this.currentLabel.textContent = labelText;
    this.currentLabel.style.cssText = `
      position: fixed;
      top: ${Math.max(0, rect.top - 20)}px;
      left: ${rect.left}px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 12px;
      font-family: monospace;
      padding: 2px 6px;
      pointer-events: none;
      z-index: 2147483647;
      white-space: nowrap;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    document.body.appendChild(this.currentHighlight);
    document.body.appendChild(this.currentLabel);
  }

  clearHover(): void {
    if (this.currentHighlight) {
      this.currentHighlight.remove();
      this.currentHighlight = null;
    }
    if (this.currentLabel) {
      this.currentLabel.remove();
      this.currentLabel = null;
    }
  }

  addSelectedElement(id: string, element: Element): number {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return 0;

    const elementNumber = this.nextNumber++;

    // Create selected highlight
    const highlight = document.createElement('div');
    highlight.className = `${HIGHLIGHT_CLASS} ${SELECTED_CLASS}`;
    highlight.dataset.weblensId = id;
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #22c55e;
      background: rgba(34, 197, 94, 0.1);
      pointer-events: none;
      z-index: 2147483645;
      box-sizing: border-box;
    `;

    // Create number badge
    const badge = document.createElement('div');
    badge.className = 'weblens-badge';
    badge.textContent = String(elementNumber);
    badge.style.cssText = `
      position: absolute;
      top: -12px;
      left: -12px;
      width: 24px;
      height: 24px;
      background: #22c55e;
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      font-family: sans-serif;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    highlight.appendChild(badge);

    // Create label
    const tagName = element.tagName.toLowerCase();
    const className =
      element.className && typeof element.className === 'string'
        ? `.${element.className.trim().split(/\s+/).join('.')}`
        : '';
    const labelText = `#${elementNumber} ${tagName}${className}`;

    const label = document.createElement('div');
    label.className = `${LABEL_CLASS} ${SELECTED_CLASS}`;
    label.dataset.weblensId = id;
    label.textContent = labelText;
    label.style.cssText = `
      position: fixed;
      top: ${Math.max(0, rect.top - 20)}px;
      left: ${rect.left}px;
      background: #22c55e;
      color: #ffffff;
      font-size: 12px;
      font-family: monospace;
      padding: 2px 6px;
      pointer-events: none;
      z-index: 2147483647;
      white-space: nowrap;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    document.body.appendChild(highlight);
    document.body.appendChild(label);

    this.selectedElements.set(id, { element, highlight, label, number: elementNumber });

    return elementNumber;
  }

  removeSelectedElement(id: string): void {
    const selected = this.selectedElements.get(id);
    if (selected) {
      selected.highlight.remove();
      selected.label.remove();
      this.selectedElements.delete(id);
    }
  }

  updateSelectedPositions(): void {
    for (const [, { element, highlight, label }] of this.selectedElements) {
      const rect = element.getBoundingClientRect();

      highlight.style.top = `${rect.top}px`;
      highlight.style.left = `${rect.left}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      label.style.top = `${Math.max(0, rect.top - 20)}px`;
      label.style.left = `${rect.left}px`;
    }
  }

  clearAll(): void {
    this.clearHover();

    for (const [, { highlight, label }] of this.selectedElements) {
      highlight.remove();
      label.remove();
    }
    this.selectedElements.clear();
    this.nextNumber = 1;
  }

  getElementNumber(id: string): number | null {
    const selected = this.selectedElements.get(id);
    return selected ? selected.number : null;
  }

  isElementSelected(element: Element): boolean {
    for (const [, { element: selectedElement }] of this.selectedElements) {
      if (selectedElement === element) {
        return true;
      }
    }
    return false;
  }
}
