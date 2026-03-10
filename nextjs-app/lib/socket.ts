// Socket.io client singleton — safe for Next.js (SSR-aware)
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() must only be called in the browser');
  }

  if (!socket) {
    // Same origin — server.js serves both Next.js pages and Socket.io on the same port
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }

  return socket;
}
