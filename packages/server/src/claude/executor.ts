import { spawn, type ChildProcess } from 'child_process';
import { logger } from '../utils/logger';

export interface ClaudeStreamMessage {
  type: 'assistant' | 'result' | 'system' | 'user';
  subtype?: string;
  content?: string;
  result?: string;
  session_id?: string;
  message?: {
    content?: Array<{ type: string; text?: string; name?: string; id?: string; input?: Record<string, unknown> }>;
  };
  tool_use_result?: {
    filePath?: string;
    oldString?: string;
    newString?: string;
    structuredPatch?: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: string[];
    }>;
    type?: string;
    file?: {
      filePath: string;
      content: string;
    };
  };
}

interface PendingToolUse {
  name: string;
  input: Record<string, unknown>;
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

export interface ClaudeExecutorCallbacks {
  onChunk: (content: string) => void;
  onComplete: (fullContent: string, sessionId?: string) => void;
  onError: (error: string) => void;
  onSessionId: (sessionId: string) => void;
  onFileOperation?: (operation: FileOperation) => void;
}

export class ClaudeExecutor {
  private process: ChildProcess | null = null;
  private isAborted = false;

  async execute(
    prompt: string,
    sessionId: string | null,
    callbacks: ClaudeExecutorCallbacks
  ): Promise<void> {
    this.isAborted = false;

    const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions'];

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    logger.info('Executing Claude CLI', { hasSessionId: !!sessionId, args });

    try {
      this.process = spawn('claude', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      logger.info('Claude process spawned', { pid: this.process.pid });

      let fullContent = '';
      let extractedSessionId: string | undefined;
      let buffer = '';
      // Track pending tool uses to match with results
      const pendingToolUses = new Map<string, PendingToolUse>();

      this.process.stdout?.on('data', (data: Buffer) => {
        if (this.isAborted) return;

        const chunk = data.toString();
        logger.debug('Claude stdout chunk', { length: chunk.length, preview: chunk.slice(0, 100) });

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const message = JSON.parse(line) as ClaudeStreamMessage;

            if (message.type === 'system' && message.subtype === 'init' && message.session_id) {
              extractedSessionId = message.session_id;
              callbacks.onSessionId(message.session_id);
              logger.info('Received session ID from Claude', { sessionId: message.session_id });
            }

            if (message.type === 'assistant') {
              // Handle nested message structure
              if (message.message?.content) {
                for (const block of message.message.content) {
                  if (block.type === 'text' && block.text) {
                    fullContent += block.text;
                    callbacks.onChunk(block.text);
                  }
                  // Track tool_use for file operations
                  if (block.type === 'tool_use' && block.name && block.id) {
                    pendingToolUses.set(block.id, {
                      name: block.name,
                      input: block.input || {},
                    });
                    logger.debug('Tracking tool use', { id: block.id, name: block.name });
                  }
                }
              } else if (message.content) {
                fullContent += message.content;
                callbacks.onChunk(message.content);
              }
            }

            // Handle tool_use_result for file operations
            if (message.type === 'user' && callbacks.onFileOperation) {
              const result = message.tool_use_result;
              
              // Get tool_use_id from message content
              const messageContent = (message as { message?: { content?: Array<{ tool_use_id?: string }> } }).message?.content;
              const toolUseId = messageContent?.[0]?.tool_use_id;
              const pendingTool = toolUseId ? pendingToolUses.get(toolUseId) : undefined;
              
              // Handle Read operations (type === 'text' with file info)
              if (result?.type === 'text' && result?.file?.filePath) {
                // This is a Read operation
                const operation: FileOperation = {
                  type: 'read',
                  filePath: result.file.filePath,
                  toolName: 'Read',
                };
                callbacks.onFileOperation(operation);
                logger.info('File operation detected', { type: operation.type, filePath: result.file.filePath });
                if (toolUseId) {
                  pendingToolUses.delete(toolUseId);
                }
              } else if (result?.filePath && result?.structuredPatch && result.structuredPatch.length > 0) {
                // This is an Edit operation (has actual changes)
                const operation: FileOperation = {
                  type: 'edit',
                  filePath: result.filePath,
                  toolName: 'Edit',
                  oldString: result.oldString,
                  newString: result.newString,
                  patch: result.structuredPatch,
                };
                callbacks.onFileOperation(operation);
                logger.info('File operation detected', { type: operation.type, filePath: result.filePath });
                if (toolUseId) {
                  pendingToolUses.delete(toolUseId);
                }
              } else if (result?.type === 'create' && result?.filePath) {
                // This is a Write/Create operation
                const operation: FileOperation = {
                  type: 'create',
                  filePath: result.filePath,
                  toolName: 'Write',
                };
                callbacks.onFileOperation(operation);
                logger.info('File operation detected', { type: operation.type, filePath: result.filePath });
                if (toolUseId) {
                  pendingToolUses.delete(toolUseId);
                }
              } else if (pendingTool?.name === 'Bash') {
                // Check if this is a file deletion command
                const command = String(pendingTool.input.command || '');
                const rmMatch = command.match(/\brm\s+(?:-[rf]+\s+)?(.+)/);
                if (rmMatch && rmMatch[1]) {
                  const filePath = rmMatch[1].trim().replace(/['"]/g, '');
                  const operation: FileOperation = {
                    type: 'delete',
                    filePath: filePath,
                    toolName: 'Bash (rm)',
                  };
                  callbacks.onFileOperation(operation);
                  logger.info('File operation detected', { type: operation.type, filePath });
                }
                if (toolUseId) {
                  pendingToolUses.delete(toolUseId);
                }
              } else {
                // Clean up pending tool use for other operations
                if (toolUseId) {
                  pendingToolUses.delete(toolUseId);
                }
              }
            }

            if (message.type === 'result') {
              if (message.result) {
                fullContent = message.result;
              } else if (message.content) {
                fullContent = message.content;
              }
            }
          } catch (parseError) {
            logger.warn('Failed to parse Claude output line', { line });
          }
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const errorText = data.toString();
        logger.warn('Claude stderr', { error: errorText });
      });

      await new Promise<void>((resolve, reject) => {
        this.process?.on('close', (code) => {
          if (this.isAborted) {
            resolve();
            return;
          }

          if (code === 0) {
            callbacks.onComplete(fullContent, extractedSessionId);
            resolve();
          } else {
            const error = `Claude CLI exited with code ${code}`;
            callbacks.onError(error);
            reject(new Error(error));
          }
        });

        this.process?.on('error', (err) => {
          const error = err.message.includes('ENOENT')
            ? 'claudeコマンドが見つかりません。Claude Code CLIがインストールされているか確認してください。'
            : err.message;
          callbacks.onError(error);
          reject(err);
        });
      });
    } catch (err) {
      logger.error('Claude executor error', err);
      throw err;
    } finally {
      this.process = null;
    }
  }

  abort(): void {
    if (this.process && !this.isAborted) {
      this.isAborted = true;
      this.process.kill('SIGTERM');
      logger.info('Claude execution aborted');
    }
  }
}
