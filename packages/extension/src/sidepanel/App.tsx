import { useEffect, useState } from 'preact/hooks';
import { useWebSocket } from './hooks/useWebSocket';
import {
  useConversation,
  conversations,
  activeConversationId,
  messages,
  selectedElements,
  isSelectingElement,
  isSending,
  currentStreamingContent,
} from './hooks/useConversation';
import { ConversationList } from './components/ConversationList';
import { ChatView } from './components/ChatView';
import { MessageInput } from './components/MessageInput';
import { ElementList } from './components/ElementList';
import type { ServerMessage, ElementInfo } from '../shared/types';
import type { ElementsUpdatedMessage } from '../shared/messages';

export function App() {
  const { status, send, onMessage } = useWebSocket();
  const {
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    addUserMessage,
    addAssistantMessage,
    removeElement,
    updateElementComment,
    clearElements,
  } = useConversation();

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Listen to WebSocket messages
  useEffect(() => {
    const unsubscribe = onMessage((message: ServerMessage) => {
      switch (message.type) {
        case 'chunk':
          // Keep isProcessing true during streaming
          currentStreamingContent.value += message.payload.content;
          setStreamingMessageId(message.payload.messageId);
          break;

        case 'complete':
          // Add the assistant message to the messages array
          addAssistantMessage(message.payload.messageId, message.payload.fullContent);
          currentStreamingContent.value = '';
          setStreamingMessageId(null);
          setIsProcessing(false);
          isSending.value = false;
          // Refresh conversation list to update titles
          fetchConversations();
          break;

        case 'error':
          console.error('WebSocket error:', message.payload.error);
          currentStreamingContent.value = '';
          setStreamingMessageId(null);
          setIsProcessing(false);
          isSending.value = false;
          break;
      }
    });

    return unsubscribe;
  }, [onMessage, addAssistantMessage, fetchConversations]);

  // Listen to element selection from content script
  useEffect(() => {
    const handleMessage = (message: ElementsUpdatedMessage) => {
      if (message.type === 'ELEMENTS_UPDATED') {
        // Preserve comments and numbers from existing elements
        const existingData = new Map(
          selectedElements.value.map((e) => [e.id, { comment: e.comment, number: e.number }])
        );
        const updatedElements = message.payload.map((elem) => {
          const existing = existingData.get(elem.id);
          return {
            ...elem,
            comment: existing?.comment || elem.comment || '',
            number: elem.number || existing?.number,
          };
        });
        selectedElements.value = updatedElements;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Stop selection mode when sidebar is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSelectingElement.value) {
        handleStopSelection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleCreateConversation = async () => {
    // Stop selection mode when creating new conversation
    if (isSelectingElement.value) {
      handleStopSelection();
    }
    const conv = await createConversation();
    if (conv) {
      selectConversation(conv.id);
    }
  };

  const handleSelectConversation = (id: string) => {
    // Stop selection mode and clear elements when switching conversations
    if (isSelectingElement.value) {
      isSelectingElement.value = false;
      chrome.runtime.sendMessage({ type: 'STOP_ELEMENT_SELECTION' });
    }
    // Clear selected elements
    clearElements();
    chrome.runtime.sendMessage({ type: 'CLEAR_SELECTED_ELEMENTS' });

    selectConversation(id);
  };

  const handleSendMessage = async (content: string) => {
    let convId = activeConversationId.value;

    // Create conversation if none active
    if (!convId) {
      const conv = await createConversation();
      if (!conv) return;
      convId = conv.id;
      await selectConversation(convId);
    }

    // Get current tab URL
    let pageUrl: string | undefined;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      pageUrl = tabs[0]?.url;
    } catch (err) {
      console.warn('Failed to get current tab URL:', err);
    }

    // Add user message to local state
    addUserMessage(content, selectedElements.value);

    // Send via WebSocket
    isSending.value = true;
    setIsProcessing(true);
    currentStreamingContent.value = '';

    send({
      type: 'chat',
      payload: {
        conversationId: convId,
        message: content,
        elements: selectedElements.value,
        pageUrl,
      },
    });

    // Clear selected elements after sending
    clearElements();
    chrome.runtime.sendMessage({ type: 'CLEAR_SELECTED_ELEMENTS' });
  };

  const handleStartSelection = () => {
    // Clear previous selections when starting new selection
    clearElements();
    chrome.runtime.sendMessage({ type: 'CLEAR_SELECTED_ELEMENTS' });

    isSelectingElement.value = true;
    chrome.runtime.sendMessage({ type: 'START_ELEMENT_SELECTION' });
  };

  const handleStopSelection = () => {
    isSelectingElement.value = false;
    chrome.runtime.sendMessage({ type: 'STOP_ELEMENT_SELECTION' });
    // Clear visual highlights on the page (but keep elements in list)
    chrome.runtime.sendMessage({ type: 'CLEAR_HIGHLIGHTS' });
  };

  const handleRemoveElement = (id: string) => {
    removeElement(id);
    chrome.runtime.sendMessage({ type: 'REMOVE_SELECTED_ELEMENT', payload: { id } });
  };

  const getStatusText = () => {
    switch (status.value) {
      case 'connecting':
        return '接続中...';
      case 'connected':
        return '接続済み';
      case 'disconnected':
        return '切断';
      case 'error':
        return 'エラー';
    }
  };

  return (
    <div class="app">
      <header class="app-header">
        <h1>weblens</h1>
        <span class={`status status-${status.value}`}>{getStatusText()}</span>
      </header>

      <main class="app-main">
        <ConversationList
          conversations={conversations.value}
          activeId={activeConversationId.value}
          onSelect={handleSelectConversation}
          onDelete={deleteConversation}
          onCreate={handleCreateConversation}
          onUpdateTitle={updateConversationTitle}
        />

        <div class="chat-section">
          <ChatView
            messages={messages.value}
            streamingContent={currentStreamingContent.value}
            streamingMessageId={streamingMessageId}
            isProcessing={isProcessing}
          />

          {activeConversationId.value && (
            <ElementList
              elements={selectedElements.value}
              isSelecting={isSelectingElement.value}
              onStartSelection={handleStartSelection}
              onStopSelection={handleStopSelection}
              onRemoveElement={handleRemoveElement}
              onCommentChange={updateElementComment}
            />
          )}

          <MessageInput
            onSend={handleSendMessage}
            disabled={status.value !== 'connected' || isSending.value}
            hasElements={selectedElements.value.length > 0}
            placeholder={
              status.value !== 'connected'
                ? 'サーバーに接続中...'
                : isSending.value
                  ? '応答を待っています...'
                  : selectedElements.value.length > 0
                    ? 'メッセージを入力（省略可）...'
                    : 'メッセージを入力...'
            }
          />
        </div>
      </main>
    </div>
  );
}
