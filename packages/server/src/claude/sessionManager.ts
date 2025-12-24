import { ClaudeExecutor, type ClaudeExecutorCallbacks } from './executor';
import { buildPrompt } from './promptBuilder';
import { setSessionId, addMessage, getConversation, updateConversation } from '../storage/fileStore';
import type { ElementInfo, Message } from '../storage/types';
import { logger } from '../utils/logger';
import { generateTitle } from '../utils/titleGenerator';
import { v4 as uuidv4 } from 'uuid';

interface ActiveSession {
  conversationId: string;
  executor: ClaudeExecutor;
}

export class SessionManager {
  private activeSessions: Map<string, ActiveSession> = new Map();

  async executeChat(
    conversationId: string,
    message: string,
    elements: ElementInfo[],
    pageUrl: string | undefined,
    callbacks: {
      onChunk: (content: string, messageId: string) => void;
      onComplete: (fullContent: string, messageId: string) => void;
      onError: (error: string) => void;
    }
  ): Promise<void> {
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      callbacks.onError('会話が見つかりません');
      return;
    }

    // Save user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      elements: elements.length > 0 ? elements : undefined,
      timestamp: new Date().toISOString(),
    };
    await addMessage(conversationId, userMessage);

    // Auto-generate title from first message if title is still default
    if (conversation.messages.length === 0 && conversation.title === '新規会話') {
      const autoTitle = generateTitle(message);
      await updateConversation(conversationId, { title: autoTitle });
      logger.info(`Auto-generated title for conversation ${conversationId}`, { title: autoTitle });
    }

    const prompt = buildPrompt(message, elements, pageUrl);
    const executor = new ClaudeExecutor();
    const assistantMessageId = uuidv4();

    this.activeSessions.set(conversationId, {
      conversationId,
      executor,
    });

    let fullContent = '';

    const executorCallbacks: ClaudeExecutorCallbacks = {
      onChunk: (content) => {
        logger.info('Received chunk from Claude', { contentLength: content.length, preview: content.slice(0, 50) });
        fullContent += content;
        callbacks.onChunk(content, assistantMessageId);
      },
      onComplete: async (content, sessionId) => {
        logger.info('Claude execution complete', { contentLength: content?.length || 0, hasSessionId: !!sessionId });
        fullContent = content || fullContent;

        // Save session ID if this is the first message
        if (sessionId && !conversation.sessionId) {
          await setSessionId(conversationId, sessionId);
        }

        // Save assistant message
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date().toISOString(),
        };
        await addMessage(conversationId, assistantMessage);

        this.activeSessions.delete(conversationId);
        callbacks.onComplete(fullContent, assistantMessageId);
      },
      onError: (error) => {
        this.activeSessions.delete(conversationId);
        callbacks.onError(error);
      },
      onSessionId: async (sessionId) => {
        if (!conversation.sessionId) {
          await setSessionId(conversationId, sessionId);
          logger.info(`Session ID saved for conversation ${conversationId}`, { sessionId });
        }
      },
    };

    try {
      await executor.execute(prompt, conversation.sessionId, executorCallbacks);
    } catch (err) {
      this.activeSessions.delete(conversationId);
      throw err;
    }
  }

  abort(conversationId: string): boolean {
    const session = this.activeSessions.get(conversationId);

    if (session) {
      session.executor.abort();
      this.activeSessions.delete(conversationId);
      return true;
    }

    return false;
  }

  isActive(conversationId: string): boolean {
    return this.activeSessions.has(conversationId);
  }
}

export const sessionManager = new SessionManager();
