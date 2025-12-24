// Storage types for server-side data persistence

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

export interface FileOperation {
  type: 'read' | 'edit' | 'write' | 'create' | 'delete';
  filePath: string;
  toolName: string;
  oldString?: string;
  newString?: string;
  patch?: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  elements?: ElementInfo[];
  fileOperations?: FileOperation[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  sessionId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationData extends Conversation {
  messages: Message[];
}

// Error codes
export type ErrorCode =
  | 'CONNECTION_FAILED'
  | 'CLAUDE_NOT_FOUND'
  | 'CLAUDE_EXECUTION_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_MESSAGE'
  | 'STORAGE_ERROR';
