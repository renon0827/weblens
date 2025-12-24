import { useEffect, useRef } from 'preact/hooks';
import type { Message, FileOperation } from '../../shared/types';

interface ChatViewProps {
  messages: Message[];
  streamingContent: string;
  streamingMessageId: string | null;
  isProcessing: boolean; // True while waiting for or receiving response
  fileOperations: FileOperation[];
}

export function ChatView({ messages, streamingContent, streamingMessageId, isProcessing, fileOperations }: ChatViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isProcessing]);

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => <div key={i}>{line || '\u00A0'}</div>);
  };

  const isStreaming = streamingMessageId && streamingContent;
  const isWaitingForResponse = isProcessing && !streamingContent;

  return (
    <div class="chat-view" ref={containerRef}>
      {messages.length === 0 && !isProcessing ? (
        <div class="chat-empty">
          <p>会話を開始するには、要素を選択してメッセージを送信してください。</p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <div key={msg.id} class={`message message-${msg.role}`}>
              <div class="message-header">
                <span class="message-role">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </span>
              </div>
              <div class="message-content">
                {formatMessage(msg.content)}
              </div>
              {msg.elements && msg.elements.length > 0 && (
                <details class="message-elements-details">
                  <summary class="message-elements-summary">
                    📎 添付要素 ({msg.elements.length}件)
                  </summary>
                  <div class="message-elements-list">
                    {msg.elements.map((elem, index) => (
                      <div key={elem.id} class="message-element-item">
                        <div class="element-selector">
                          <span class="element-number-badge">
                            {elem.number || index + 1}
                          </span>
                          <code>{elem.tagName.toLowerCase()}</code>
                          {elem.id_attr && <code>#{elem.id_attr}</code>}
                          {elem.className && (
                            <code>.{elem.className.split(' ').join('.')}</code>
                          )}
                        </div>
                        {elem.comment && (
                          <div class="element-comment-display">
                            💬 {elem.comment}
                          </div>
                        )}
                        {elem.outerHTML && (
                          <pre class="element-html-preview">
                            {elem.outerHTML.length > 200
                              ? elem.outerHTML.slice(0, 200) + '...'
                              : elem.outerHTML}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {/* Show saved file operations for assistant messages */}
              {msg.role === 'assistant' && msg.fileOperations && msg.fileOperations.length > 0 && (
                <details class="file-operations-details">
                  <summary class="file-operations-summary">
                    📁 ファイル変更 ({msg.fileOperations.length}件)
                  </summary>
                  <div class="file-operations-list">
                    {msg.fileOperations.map((op, index) => (
                      <div key={index} class={`file-operation file-operation-${op.type}`}>
                        <div class="file-operation-header">
                          <span class="file-operation-type">
                            {op.type === 'read' ? '📖 読込' : op.type === 'edit' ? '✏️ 編集' : op.type === 'write' || op.type === 'create' ? '📝 作成' : op.type === 'delete' ? '🗑️ 削除' : '📄 変更'}
                          </span>
                          <code class="file-operation-path">{op.filePath}</code>
                        </div>
                        {op.patch && op.patch.length > 0 && (
                          <pre class="file-operation-diff">
                            {op.patch.map((hunk) => 
                              hunk.lines.map((line, lineIndex) => (
                                <div 
                                  key={lineIndex} 
                                  class={`diff-line ${line.startsWith('+') ? 'diff-add' : line.startsWith('-') ? 'diff-remove' : ''}`}
                                >
                                  {line}
                                </div>
                              ))
                            )}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
          {/* Show processing indicator (thinking or streaming) */}
          {isProcessing && (
            <div class={`message message-assistant ${isWaitingForResponse ? 'thinking' : 'streaming'}`}>
              <div class="message-header">
                <span class="message-role">🤖</span>
              </div>
              <div class="message-content">
                {isStreaming && formatMessage(streamingContent)}
              </div>
              {/* Show file operations during streaming */}
              {fileOperations.length > 0 && (
                <details class="file-operations-details">
                  <summary class="file-operations-summary">
                    📁 ファイル変更 ({fileOperations.length}件)
                  </summary>
                  <div class="file-operations-list">
                    {fileOperations.map((op, index) => (
                      <div key={index} class={`file-operation file-operation-${op.type}`}>
                        <div class="file-operation-header">
                          <span class="file-operation-type">
                            {op.type === 'read' ? '📖 読込' : op.type === 'edit' ? '✏️ 編集' : op.type === 'write' || op.type === 'create' ? '📝 作成' : op.type === 'delete' ? '🗑️ 削除' : '📄 変更'}
                          </span>
                          <code class="file-operation-path">{op.filePath}</code>
                        </div>
                        {op.patch && op.patch.length > 0 && (
                          <pre class="file-operation-diff">
                            {op.patch.map((hunk) => 
                              hunk.lines.map((line, lineIndex) => (
                                <div 
                                  key={lineIndex} 
                                  class={`diff-line ${line.startsWith('+') ? 'diff-add' : line.startsWith('-') ? 'diff-remove' : ''}`}
                                >
                                  {line}
                                </div>
                              ))
                            )}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <div class="message-status">
                <span class="status-indicator">
                  <span class="dot">.</span>
                  <span class="dot">.</span>
                  <span class="dot">.</span>
                </span>
                <span class="status-text">
                  {isWaitingForResponse ? 'Thinking' : 'Generating'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
