import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Conversation, ConversationData, Message } from './types';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data/conversations');

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

function getFilePath(id: string): string {
  return join(DATA_DIR, `${id}.json`);
}

export async function getAllConversations(): Promise<Conversation[]> {
  await ensureDataDir();

  try {
    const files = await readdir(DATA_DIR);
    const conversations: Conversation[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = await readFile(join(DATA_DIR, file), 'utf-8');
        const data = JSON.parse(content) as ConversationData;
        conversations.push({
          id: data.id,
          sessionId: data.sessionId,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } catch (err) {
        logger.warn(`Failed to read conversation file: ${file}`, err);
      }
    }

    return conversations.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (err) {
    logger.error('Failed to read conversations directory', err);
    return [];
  }
}

export async function getConversation(id: string): Promise<ConversationData | null> {
  await ensureDataDir();

  const filePath = getFilePath(id);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as ConversationData;
  } catch (err) {
    logger.error(`Failed to read conversation: ${id}`, err);
    return null;
  }
}

export async function createConversation(id: string, title: string = '新規会話'): Promise<ConversationData> {
  await ensureDataDir();

  const now = new Date().toISOString();
  const conversation: ConversationData = {
    id,
    sessionId: null,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  await writeFile(getFilePath(id), JSON.stringify(conversation, null, 2), 'utf-8');
  logger.info(`Created conversation: ${id}`);

  return conversation;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<ConversationData, 'sessionId' | 'title' | 'updatedAt'>>
): Promise<ConversationData | null> {
  const conversation = await getConversation(id);

  if (!conversation) {
    return null;
  }

  const updated: ConversationData = {
    ...conversation,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(getFilePath(id), JSON.stringify(updated, null, 2), 'utf-8');
  logger.info(`Updated conversation: ${id}`);

  return updated;
}

export async function addMessage(
  conversationId: string,
  message: Message
): Promise<ConversationData | null> {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return null;
  }

  conversation.messages.push(message);
  conversation.updatedAt = new Date().toISOString();

  // Auto-generate title from first user message
  if (conversation.title === '新規会話' && message.role === 'user') {
    const titleText = message.content.slice(0, 30);
    conversation.title = titleText + (message.content.length > 30 ? '...' : '');
  }

  await writeFile(getFilePath(conversationId), JSON.stringify(conversation, null, 2), 'utf-8');
  logger.info(`Added message to conversation: ${conversationId}`);

  return conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const filePath = getFilePath(id);

  if (!existsSync(filePath)) {
    return false;
  }

  try {
    await unlink(filePath);
    logger.info(`Deleted conversation: ${id}`);
    return true;
  } catch (err) {
    logger.error(`Failed to delete conversation: ${id}`, err);
    return false;
  }
}

export async function setSessionId(
  conversationId: string,
  sessionId: string
): Promise<ConversationData | null> {
  return updateConversation(conversationId, { sessionId });
}
