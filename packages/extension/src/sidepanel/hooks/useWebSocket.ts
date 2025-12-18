import { useEffect, useRef, useCallback } from 'preact/hooks';
import { signal, type Signal } from '@preact/signals';
import type { ServerMessage, ClientMessage } from '../../shared/types';

const WS_URL = 'ws://localhost:3456/ws';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketReturn {
  status: Signal<ConnectionStatus>;
  connectionId: Signal<string | null>;
  send: (message: ClientMessage) => void;
  onMessage: (handler: (message: ServerMessage) => void) => () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const status = useRef(signal<ConnectionStatus>('disconnected'));
  const connectionId = useRef(signal<string | null>(null));
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const messageHandlers = useRef<Set<(message: ServerMessage) => void>>(new Set());
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    status.current.value = 'connecting';

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        status.current.value = 'connected';
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;

          if (message.type === 'connected') {
            connectionId.current.value = message.payload.connectionId;
          }

          messageHandlers.current.forEach((handler) => handler(message));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        status.current.value = 'disconnected';
        connectionId.current.value = null;
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttempt.current < RECONNECT_DELAYS.length) {
          const delay = RECONNECT_DELAYS[reconnectAttempt.current] ?? 16000;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempt.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        status.current.value = 'error';
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      status.current.value = 'error';
    }
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const onMessage = useCallback((handler: (message: ServerMessage) => void) => {
    messageHandlers.current.add(handler);
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    status: status.current,
    connectionId: connectionId.current,
    send,
    onMessage,
  };
}
