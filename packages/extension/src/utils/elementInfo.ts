import { v4 as uuidv4 } from 'uuid';
import type { ElementInfo, ComputedStyleInfo, BoundingRectInfo, ParentInfo } from '../shared/types';

const MAX_TEXT_LENGTH = 500;
const MAX_INNER_HTML_LENGTH = 5000;
const MAX_OUTER_HTML_LENGTH = 10000;

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

function getUniqueSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(' > ');
}

function getXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling: Element | null = current.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
    parts.unshift(part);

    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

function getComputedStyles(element: Element): ComputedStyleInfo {
  const computed = window.getComputedStyle(element);

  return {
    display: computed.display,
    position: computed.position,
    width: computed.width,
    height: computed.height,
    color: computed.color,
    backgroundColor: computed.backgroundColor,
    fontSize: computed.fontSize,
    fontFamily: computed.fontFamily,
    margin: computed.margin,
    padding: computed.padding,
    border: computed.border,
    borderRadius: computed.borderRadius,
    boxShadow: computed.boxShadow,
    opacity: computed.opacity,
    zIndex: computed.zIndex,
    overflow: computed.overflow,
    textAlign: computed.textAlign,
    lineHeight: computed.lineHeight,
    fontWeight: computed.fontWeight,
  };
}

function getBoundingRect(element: Element): BoundingRectInfo {
  const rect = element.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function getParentInfo(element: Element): ParentInfo {
  const parent = element.parentElement;

  if (!parent) {
    return {
      tagName: '',
      id_attr: null,
      className: '',
    };
  }

  return {
    tagName: parent.tagName.toLowerCase(),
    id_attr: parent.id || null,
    className: parent.className || '',
  };
}

function getAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};

  for (const attr of element.attributes) {
    if (attr.name !== 'id' && attr.name !== 'class') {
      attrs[attr.name] = attr.value;
    }
  }

  return attrs;
}

export function extractElementInfo(element: Element): ElementInfo {
  const htmlElement = element as HTMLElement;

  return {
    id: uuidv4(),
    tagName: element.tagName.toLowerCase(),
    selector: getUniqueSelector(element),
    xpath: getXPath(element),
    id_attr: element.id || null,
    className: element.className || '',
    attributes: getAttributes(element),
    textContent: truncate((element.textContent || '').trim(), MAX_TEXT_LENGTH),
    innerText: truncate((htmlElement.innerText || '').trim(), MAX_TEXT_LENGTH),
    innerHTML: truncate(element.innerHTML, MAX_INNER_HTML_LENGTH),
    outerHTML: truncate(element.outerHTML, MAX_OUTER_HTML_LENGTH),
    computedStyles: getComputedStyles(element),
    boundingRect: getBoundingRect(element),
    parentInfo: getParentInfo(element),
    comment: '',
  };
}
