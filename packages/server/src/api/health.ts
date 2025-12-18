import type { FastifyInstance } from 'fastify';

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });
}
