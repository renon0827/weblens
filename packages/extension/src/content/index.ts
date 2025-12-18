import { ElementSelector } from './ElementSelector';
import type { ExtensionMessage } from '../shared/messages';
import type { ElementInfo } from '../shared/types';

const selector = new ElementSelector();

// Handle messages from background script
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (response?: unknown) => void) => {
    switch (message.type) {
      case 'START_ELEMENT_SELECTION':
        selector.start({
          onElementSelected: (elementInfo: ElementInfo) => {
            chrome.runtime.sendMessage({
              type: 'ELEMENT_SELECTED',
              payload: elementInfo,
            });
          },
          onSelectionModeEnded: () => {
            chrome.runtime.sendMessage({
              type: 'STOP_ELEMENT_SELECTION',
            });
          },
        });
        sendResponse({ success: true });
        break;

      case 'STOP_ELEMENT_SELECTION':
        selector.stop();
        sendResponse({ success: true });
        break;

      case 'REMOVE_SELECTED_ELEMENT':
        if ('payload' in message && message.payload) {
          selector.removeSelectedElement(message.payload.id);
        }
        sendResponse({ success: true });
        break;

      case 'GET_SELECTED_ELEMENTS':
        sendResponse({ elements: selector.getSelectedElements() });
        break;

      case 'CLEAR_SELECTED_ELEMENTS':
        selector.clearSelectedElements();
        sendResponse({ success: true });
        break;

      case 'CLEAR_HIGHLIGHTS':
        selector.clearHighlights();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true; // Keep the message channel open for async response
  }
);

// Notify that content script is loaded
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });
