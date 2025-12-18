import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateConversation,
} from '../storage/fileStore';

export function registerConversationRoutes(app: FastifyInstance): void {
  // Get all conversations
  app.get('/api/conversations', async () => {
    const conversations = await getAllConversations();
    return { conversations };
  });

  // Create new conversation
  app.post('/api/conversations', async () => {
    const id = uuidv4();
    const conversation = await createConversation(id);
    return conversation;
  });

  // Get conversation by ID
  app.get<{ Params: { id: string } }>('/api/conversations/:id', async (request, reply) => {
    const { id } = request.params;
    const conversation = await getConversation(id);

    if (!conversation) {
      return reply.status(404).send({ error: '会話が見つかりません' });
    }

    return conversation;
  });

  // Update conversation title
  app.patch<{ Params: { id: string }; Body: { title: string } }>(
    '/api/conversations/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { title } = request.body;

      if (!title || typeof title !== 'string') {
        return reply.status(400).send({ error: 'タイトルは必須です' });
      }

      const updated = await updateConversation(id, { title });

      if (!updated) {
        return reply.status(404).send({ error: '会話が見つかりません' });
      }

      return {
        id: updated.id,
        sessionId: updated.sessionId,
        title: updated.title,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }
  );

  // Delete conversation
  app.delete<{ Params: { id: string } }>('/api/conversations/:id', async (request, reply) => {
    const { id } = request.params;
    const deleted = await deleteConversation(id);

    if (!deleted) {
      return reply.status(404).send({ error: '会話が見つかりません' });
    }

    return { success: true };
  });
}
