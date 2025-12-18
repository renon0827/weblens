import type { ExtensionMessage } from '../shared/messages';
import type { ElementInfo } from '../shared/types';

// Store selected elements per tab
const selectedElementsPerTab: Map<number, ElementInfo[]> = new Map();

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-weblens',
    title: 'weblensで開く',
    contexts: ['page', 'selection', 'image', 'link'],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-weblens' && tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage & { type: string }, sender, sendResponse) => {
    const tabId = sender.tab?.id;

    switch (message.type) {
      case 'ELEMENT_SELECTED':
        if (tabId && 'payload' in message) {
          const elements = selectedElementsPerTab.get(tabId) || [];
          elements.push(message.payload as ElementInfo);
          selectedElementsPerTab.set(tabId, elements);

          // Notify side panel
          chrome.runtime.sendMessage({
            type: 'ELEMENTS_UPDATED',
            payload: elements,
          });
        }
        sendResponse({ success: true });
        break;

      case 'START_ELEMENT_SELECTION':
        // Forward to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'START_ELEMENT_SELECTION' });
          }
        });
        sendResponse({ success: true });
        break;

      case 'STOP_ELEMENT_SELECTION':
        // Forward to content script if from side panel
        if (!sender.tab) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_ELEMENT_SELECTION' });
            }
          });
        }
        sendResponse({ success: true });
        break;

      case 'REMOVE_SELECTED_ELEMENT':
        if ('payload' in message) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTabId = tabs[0]?.id;
            if (activeTabId) {
              const elements = selectedElementsPerTab.get(activeTabId) || [];
              const filteredElements = elements.filter(
                (e) => e.id !== (message.payload as { id: string }).id
              );
              selectedElementsPerTab.set(activeTabId, filteredElements);

              // Forward to content script
              chrome.tabs.sendMessage(activeTabId, {
                type: 'REMOVE_SELECTED_ELEMENT',
                payload: message.payload,
              });

              // Notify side panel
              chrome.runtime.sendMessage({
                type: 'ELEMENTS_UPDATED',
                payload: filteredElements,
              });
            }
          });
        }
        sendResponse({ success: true });
        break;

      case 'GET_SELECTED_ELEMENTS':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTabId = tabs[0]?.id;
          if (activeTabId) {
            const elements = selectedElementsPerTab.get(activeTabId) || [];
            sendResponse({ elements });
          } else {
            sendResponse({ elements: [] });
          }
        });
        return true; // Keep channel open for async response

      case 'CLEAR_SELECTED_ELEMENTS':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTabId = tabs[0]?.id;
          if (activeTabId) {
            selectedElementsPerTab.set(activeTabId, []);

            // Forward to content script
            chrome.tabs.sendMessage(activeTabId, { type: 'CLEAR_SELECTED_ELEMENTS' });

            // Notify side panel
            chrome.runtime.sendMessage({
              type: 'ELEMENTS_UPDATED',
              payload: [],
            });
          }
        });
        sendResponse({ success: true });
        break;

      case 'CLEAR_HIGHLIGHTS':
        // Clear visual highlights only, keep elements in memory
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTabId = tabs[0]?.id;
          if (activeTabId) {
            chrome.tabs.sendMessage(activeTabId, { type: 'CLEAR_HIGHLIGHTS' });
          }
        });
        sendResponse({ success: true });
        break;

      case 'CONTENT_SCRIPT_LOADED':
        // Content script is ready
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true;
  }
);

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  selectedElementsPerTab.delete(tabId);
});

// Set up side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));
