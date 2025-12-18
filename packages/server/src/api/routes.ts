import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health';
import { registerConversationRoutes } from './conversations';

export function registerRoutes(app: FastifyInstance): void {
  registerHealthRoutes(app);
  registerConversationRoutes(app);
}
