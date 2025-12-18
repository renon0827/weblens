import type { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface Connection {
  id: string;
  socket: WebSocket;
  createdAt: Date;
}

class ConnectionManager {
  private connections: Map<string, Connection> = new Map();

  add(socket: WebSocket): string {
    const id = uuidv4();
    this.connections.set(id, {
      id,
      socket,
      createdAt: new Date(),
    });
    logger.info(`Connection added: ${id}`);
    return id;
  }

  remove(id: string): void {
    if (this.connections.has(id)) {
      this.connections.delete(id);
      logger.info(`Connection removed: ${id}`);
    }
  }

  get(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  getAll(): Connection[] {
    return Array.from(this.connections.values());
  }

  send(id: string, data: unknown): void {
    const conn = this.connections.get(id);
    if (!conn) {
      logger.warn('Connection not found for send', { id });
      return;
    }
    if (conn.socket.readyState !== conn.socket.OPEN) {
      logger.warn('Socket not open for send', { id, readyState: conn.socket.readyState });
      return;
    }
    logger.info('Sending WebSocket message', { id, type: (data as { type?: string }).type });
    conn.socket.send(JSON.stringify(data));
  }

  broadcast(data: unknown): void {
    const message = JSON.stringify(data);
    for (const conn of this.connections.values()) {
      if (conn.socket.readyState === conn.socket.OPEN) {
        conn.socket.send(message);
      }
    }
  }
}

export const connectionManager = new ConnectionManager();
