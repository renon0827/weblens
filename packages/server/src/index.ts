import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { registerRoutes } from './api/routes';
import { handleWebSocket } from './ws/handler';
import { logger } from './utils/logger';

const HOST = 'localhost';
const PORT = 3456;

async function main(): Promise<void> {
  const app = Fastify({
    logger: false,
  });

  // Register CORS
  await app.register(cors, {
    origin: true, // Allow all origins (localhost only access)
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Register WebSocket
  await app.register(websocket);

  // Register REST routes
  registerRoutes(app);

  // Register WebSocket route
  app.get('/ws', { websocket: true }, (socket) => {
    handleWebSocket(socket);
  });

  try {
    await app.listen({ host: HOST, port: PORT });
    logger.info(`Server running at http://${HOST}:${PORT}`);
    logger.info(`WebSocket available at ws://${HOST}:${PORT}/ws`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

main();
