// Element information extracted from selected DOM elements
export interface ElementInfo {
  id: string;
  number?: number;
  tagName: string;
  selector: string;
  xpath: string;
  id_attr: string | null;
  className: string;
  attributes: Record<string, string>;
  textContent: string;
  innerText: string;
  innerHTML: string;
  outerHTML: string;
  computedStyles: ComputedStyleInfo;
  boundingRect: BoundingRectInfo;
  parentInfo: ParentInfo;
  comment: string;
}

export interface ComputedStyleInfo {
  display: string;
  position: string;
  width: string;
  height: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontFamily: string;
  margin: string;
  padding: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  opacity: string;
  zIndex: string;
  overflow: string;
  textAlign: string;
  lineHeight: string;
  fontWeight: string;
}

export interface BoundingRectInfo {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ParentInfo {
  tagName: string;
  id_attr: string | null;
  className: string;
}

// Conversation and message types
export interface Conversation {
  id: string;
  sessionId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  elements?: ElementInfo[];
  fileOperations?: FileOperation[];
  timestamp: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// App state
export interface AppState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  selectedElements: ElementInfo[];
  isSelectingElement: boolean;
  isSending: boolean;
}

// WebSocket message types (Client -> Server)
export interface ChatMessage {
  type: 'chat';
  payload: {
    conversationId: string;
    message: string;
    elements: ElementInfo[];
    pageUrl?: string;
  };
}

export interface AbortMessage {
  type: 'abort';
  payload: {
    conversationId: string;
  };
}

export type ClientMessage = ChatMessage | AbortMessage;

// File operation types
export interface FileOperation {
  type: 'read' | 'edit' | 'write' | 'create' | 'delete';
  filePath: string;
  toolName: string;
  oldString?: string;
  newString?: string;
  patch?: PatchHunk[];
}

export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

// WebSocket message types (Server -> Client)
export interface ConnectedMessage {
  type: 'connected';
  payload: {
    connectionId: string;
  };
}

export interface ChunkMessage {
  type: 'chunk';
  payload: {
    conversationId: string;
    content: string;
    messageId: string;
  };
}

export interface CompleteMessage {
  type: 'complete';
  payload: {
    conversationId: string;
    messageId: string;
    fullContent: string;
    sessionId?: string;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    conversationId: string;
    error: string;
    code: ErrorCode;
  };
}

export interface FileOperationMessage {
  type: 'file_operation';
  payload: {
    conversationId: string;
    messageId: string;
    operation: FileOperation;
  };
}

export type ServerMessage = ConnectedMessage | ChunkMessage | CompleteMessage | ErrorMessage | FileOperationMessage;

// Error codes
export type ErrorCode =
  | 'CONNECTION_FAILED'
  | 'CLAUDE_NOT_FOUND'
  | 'CLAUDE_EXECUTION_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_MESSAGE'
  | 'STORAGE_ERROR';
