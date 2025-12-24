import type { WebSocket, RawData } from 'ws';
import { connectionManager } from './connections';
import { sessionManager } from '../claude/sessionManager';
import { logger } from '../utils/logger';
import type { ElementInfo } from '../storage/types';

interface ChatPayload {
  conversationId: string;
  message: string;
  elements: ElementInfo[];
  pageUrl?: string;
}

interface AbortPayload {
  conversationId: string;
}

interface ClientMessage {
  type: 'chat' | 'abort';
  payload: ChatPayload | AbortPayload;
}

function isChatPayload(payload: unknown): payload is ChatPayload {
  const p = payload as ChatPayload;
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof p.conversationId === 'string' &&
    typeof p.message === 'string' &&
    Array.isArray(p.elements) &&
    (p.pageUrl === undefined || typeof p.pageUrl === 'string')
  );
}

function isAbortPayload(payload: unknown): payload is AbortPayload {
  const p = payload as AbortPayload;
  return typeof p === 'object' && p !== null && typeof p.conversationId === 'string';
}

export function handleWebSocket(socket: WebSocket): void {
  const connectionId = connectionManager.add(socket);

  // Send connected message
  socket.send(
    JSON.stringify({
      type: 'connected',
      payload: { connectionId },
    })
  );

  socket.on('message', async (rawData: RawData) => {
    try {
      const message: ClientMessage = JSON.parse(rawData.toString());
      logger.info('Received WebSocket message', { type: message.type });

      switch (message.type) {
        case 'chat':
          await handleChatMessage(connectionId, message.payload);
          break;

        case 'abort':
          handleAbortMessage(connectionId, message.payload);
          break;

        default:
          sendError(connectionId, '', 'Invalid message type', 'INVALID_MESSAGE');
      }
    } catch (err) {
      logger.error('Failed to parse WebSocket message', err);
      sendError(connectionId, '', 'Invalid message format', 'INVALID_MESSAGE');
    }
  });

  socket.on('close', () => {
    connectionManager.remove(connectionId);
  });

  socket.on('error', (err) => {
    logger.error('WebSocket error', err);
    connectionManager.remove(connectionId);
  });
}

async function handleChatMessage(connectionId: string, payload: unknown): Promise<void> {
  if (!isChatPayload(payload)) {
    sendError(connectionId, '', 'Invalid chat payload', 'INVALID_MESSAGE');
    return;
  }

  const { conversationId, message, elements, pageUrl } = payload;

  logger.info('Processing chat message', {
    conversationId,
    elementCount: elements.length,
    pageUrl,
  });

  try {
    await sessionManager.executeChat(conversationId, message, elements, pageUrl, {
      onChunk: (content, messageId) => {
        logger.info('Sending chunk to client', { connectionId, messageId, contentLength: content.length });
        connectionManager.send(connectionId, {
          type: 'chunk',
          payload: {
            conversationId,
            content,
            messageId,
          },
        });
      },
      onComplete: (fullContent, messageId) => {
        logger.info('Sending complete to client', { connectionId, messageId, contentLength: fullContent.length });
        connectionManager.send(connectionId, {
          type: 'complete',
          payload: {
            conversationId,
            messageId,
            fullContent,
          },
        });
      },
      onError: (error) => {
        const code = error.includes('見つかりません')
          ? 'CLAUDE_NOT_FOUND'
          : 'CLAUDE_EXECUTION_ERROR';
        sendError(connectionId, conversationId, error, code);
      },
    });
  } catch (err) {
    logger.error('Chat execution error', err);
    sendError(connectionId, conversationId, 'Claude Codeの実行に失敗しました', 'CLAUDE_EXECUTION_ERROR');
  }
}

function handleAbortMessage(connectionId: string, payload: unknown): void {
  if (!isAbortPayload(payload)) {
    sendError(connectionId, '', 'Invalid abort payload', 'INVALID_MESSAGE');
    return;
  }

  const { conversationId } = payload;
  const aborted = sessionManager.abort(conversationId);

  if (!aborted) {
    logger.warn('No active session to abort', { conversationId });
  }
}

function sendError(
  connectionId: string,
  conversationId: string,
  error: string,
  code: string
): void {
  connectionManager.send(connectionId, {
    type: 'error',
    payload: {
      conversationId,
      error,
      code,
    },
  });
}
