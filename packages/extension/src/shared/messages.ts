import type { ElementInfo } from './types';

// Message types for communication between extension components
export type MessageType =
  | 'START_ELEMENT_SELECTION'
  | 'STOP_ELEMENT_SELECTION'
  | 'ELEMENT_SELECTED'
  | 'REMOVE_SELECTED_ELEMENT'
  | 'ELEMENTS_UPDATED'
  | 'CONNECTION_STATUS'
  | 'GET_SELECTED_ELEMENTS'
  | 'CLEAR_SELECTED_ELEMENTS';

// Background <-> Content Script messages
export interface StartElementSelectionMessage {
  type: 'START_ELEMENT_SELECTION';
}

export interface StopElementSelectionMessage {
  type: 'STOP_ELEMENT_SELECTION';
}

export interface ElementSelectedMessage {
  type: 'ELEMENT_SELECTED';
  payload: ElementInfo;
}

export interface RemoveSelectedElementMessage {
  type: 'REMOVE_SELECTED_ELEMENT';
  payload: { id: string };
}

export interface GetSelectedElementsMessage {
  type: 'GET_SELECTED_ELEMENTS';
}

export interface ClearSelectedElementsMessage {
  type: 'CLEAR_SELECTED_ELEMENTS';
}

// Background <-> Side Panel messages
export interface ElementsUpdatedMessage {
  type: 'ELEMENTS_UPDATED';
  payload: ElementInfo[];
}

export interface ConnectionStatusMessage {
  type: 'CONNECTION_STATUS';
  payload: { status: 'connected' | 'disconnected' | 'error' };
}

export type ExtensionMessage =
  | StartElementSelectionMessage
  | StopElementSelectionMessage
  | ElementSelectedMessage
  | RemoveSelectedElementMessage
  | ElementsUpdatedMessage
  | ConnectionStatusMessage
  | GetSelectedElementsMessage
  | ClearSelectedElementsMessage;

// Type guard functions
export function isElementSelectedMessage(msg: ExtensionMessage): msg is ElementSelectedMessage {
  return msg.type === 'ELEMENT_SELECTED';
}

export function isElementsUpdatedMessage(msg: ExtensionMessage): msg is ElementsUpdatedMessage {
  return msg.type === 'ELEMENTS_UPDATED';
}

export function isConnectionStatusMessage(msg: ExtensionMessage): msg is ConnectionStatusMessage {
  return msg.type === 'CONNECTION_STATUS';
}
