import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health';
import { registerConversationRoutes } from './conversations';
import { registerFilesystemRoutes } from './filesystem';

export function registerRoutes(app: FastifyInstance): void {
  registerHealthRoutes(app);
  registerConversationRoutes(app);
  registerFilesystemRoutes(app);
}
