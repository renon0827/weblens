import { spawn, type ChildProcess } from 'child_process';
import { logger } from '../utils/logger';

export interface ClaudeStreamMessage {
  type: 'assistant' | 'result' | 'system';
  subtype?: string;
  content?: string;
  result?: string;
  session_id?: string;
  message?: {
    content?: Array<{ type: string; text?: string }>;
  };
}

export interface ClaudeExecutorCallbacks {
  onChunk: (content: string) => void;
  onComplete: (fullContent: string, sessionId?: string) => void;
  onError: (error: string) => void;
  onSessionId: (sessionId: string) => void;
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
                }
              } else if (message.content) {
                fullContent += message.content;
                callbacks.onChunk(message.content);
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
