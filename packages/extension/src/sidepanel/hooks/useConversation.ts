import { useCallback } from 'preact/hooks';
import { signal, computed } from '@preact/signals';
import type { Conversation, ConversationWithMessages, Message, ElementInfo, FileOperation } from '../../shared/types';

const API_BASE = 'http://localhost:3456/api';

// Signals for state management
export const conversations = signal<Conversation[]>([]);
export const activeConversationId = signal<string | null>(null);
export const messages = signal<Message[]>([]);
export const selectedElements = signal<ElementInfo[]>([]);
export const isSelectingElement = signal(false);
export const isSending = signal(false);
export const currentStreamingContent = signal('');

export const activeConversation = computed(() => {
  const id = activeConversationId.value;
  return conversations.value.find((c) => c.id === id) ?? null;
});

export function useConversation() {
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      const data = await response.json();
      conversations.value = data.conversations;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  const createConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
      });
      const conversation = await response.json();
      conversations.value = [conversation, ...conversations.value];
      return conversation;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    activeConversationId.value = id;
    messages.value = [];

    try {
      const response = await fetch(`${API_BASE}/conversations/${id}`);
      const data: ConversationWithMessages = await response.json();
      messages.value = data.messages;
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/conversations/${id}`, {
        method: 'DELETE',
      });
      conversations.value = conversations.value.filter((c) => c.id !== id);

      if (activeConversationId.value === id) {
        activeConversationId.value = null;
        messages.value = [];
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, []);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const updated = await response.json();
      conversations.value = conversations.value.map((c) =>
        c.id === id ? { ...c, title: updated.title } : c
      );
    } catch (err) {
      console.error('Failed to update conversation title:', err);
    }
  }, []);

  const addUserMessage = useCallback((content: string, elements?: ElementInfo[]) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      elements: elements && elements.length > 0 ? elements : undefined,
      timestamp: new Date().toISOString(),
    };
    messages.value = [...messages.value, message];
    return message;
  }, []);

  const addAssistantMessage = useCallback((id: string, content: string, fileOperations?: FileOperation[]) => {
    const message: Message = {
      id,
      role: 'assistant',
      content,
      fileOperations: fileOperations && fileOperations.length > 0 ? fileOperations : undefined,
      timestamp: new Date().toISOString(),
    };
    messages.value = [...messages.value, message];
    return message;
  }, []);

  const updateAssistantMessage = useCallback((id: string, content: string) => {
    messages.value = messages.value.map((m) =>
      m.id === id ? { ...m, content } : m
    );
  }, []);

  const addElement = useCallback((element: ElementInfo) => {
    selectedElements.value = [...selectedElements.value, element];
  }, []);

  const removeElement = useCallback((id: string) => {
    selectedElements.value = selectedElements.value.filter((e) => e.id !== id);
  }, []);

  const updateElementComment = useCallback((id: string, comment: string) => {
    selectedElements.value = selectedElements.value.map((e) =>
      e.id === id ? { ...e, comment } : e
    );
  }, []);

  const clearElements = useCallback(() => {
    selectedElements.value = [];
  }, []);

  return {
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    addElement,
    removeElement,
    updateElementComment,
    clearElements,
  };
}
