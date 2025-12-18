import { Highlighter } from './Highlighter';
import { extractElementInfo } from '../utils/elementInfo';
import type { ElementInfo } from '../shared/types';

export interface ElementSelectorCallbacks {
  onElementSelected: (elementInfo: ElementInfo) => void;
  onSelectionModeEnded: () => void;
}

export class ElementSelector {
  private isActive = false;
  private highlighter: Highlighter;
  private callbacks: ElementSelectorCallbacks | null = null;
  private selectedElements: Map<string, { info: ElementInfo; element: Element }> = new Map();
  private overlay: HTMLElement | null = null;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundScroll: () => void;

  constructor() {
    this.highlighter = new Highlighter();

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundScroll = this.handleScroll.bind(this);
  }

  start(callbacks: ElementSelectorCallbacks): void {
    if (this.isActive) return;

    this.isActive = true;
    this.callbacks = callbacks;

    this.createOverlay();

    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeyDown, true);
    window.addEventListener('scroll', this.boundScroll, true);
  }

  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.highlighter.clearHover();
    this.removeOverlay();

    document.removeEventListener('mousemove', this.boundMouseMove, true);
    document.removeEventListener('click', this.boundClick, true);
    document.removeEventListener('keydown', this.boundKeyDown, true);
    window.removeEventListener('scroll', this.boundScroll, true);

    this.callbacks?.onSelectionModeEnded();
    this.callbacks = null;
  }

  getSelectedElements(): ElementInfo[] {
    return Array.from(this.selectedElements.values()).map((item) => item.info);
  }

  removeSelectedElement(id: string): void {
    this.selectedElements.delete(id);
    this.highlighter.removeSelectedElement(id);
  }

  clearSelectedElements(): void {
    this.selectedElements.clear();
    this.highlighter.clearAll();
  }

  clearHighlights(): void {
    // Clear only visual highlights, keep element data
    this.highlighter.clearAll();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'weblens-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483644;
      pointer-events: none;
      cursor: crosshair;
    `;
    document.body.appendChild(this.overlay);
    document.body.style.cursor = 'crosshair';
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    document.body.style.cursor = '';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isActive) return;

    const element = this.getElementAtPoint(e.clientX, e.clientY);
    const isSelected = element ? this.highlighter.isElementSelected(element) : false;

    this.highlighter.highlightElement(element, { isSelected });
  }

  private handleClick(e: MouseEvent): void {
    if (!this.isActive) return;

    e.preventDefault();
    e.stopPropagation();

    const element = this.getElementAtPoint(e.clientX, e.clientY);
    if (!element) return;

    // Check if already selected
    if (this.highlighter.isElementSelected(element)) {
      return;
    }

    const elementInfo = extractElementInfo(element);
    const elementNumber = this.highlighter.addSelectedElement(elementInfo.id, element);

    // Add number to element info
    elementInfo.number = elementNumber;

    this.selectedElements.set(elementInfo.id, {
      info: elementInfo,
      element,
    });

    this.highlighter.clearHover();

    this.callbacks?.onElementSelected(elementInfo);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.stop();
    }
  }

  private handleScroll(): void {
    this.highlighter.updateSelectedPositions();
  }

  private getElementAtPoint(x: number, y: number): Element | null {
    // Temporarily hide our overlays to get the actual element
    const overlays = document.querySelectorAll(
      '#weblens-overlay, .weblens-highlight, .weblens-label'
    );
    overlays.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    const element = document.elementFromPoint(x, y);

    overlays.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });

    // Filter out our own elements and body/html
    if (
      !element ||
      element === document.body ||
      element === document.documentElement ||
      element.id === 'weblens-overlay' ||
      element.classList.contains('weblens-highlight') ||
      element.classList.contains('weblens-label')
    ) {
      return null;
    }

    return element;
  }
}
