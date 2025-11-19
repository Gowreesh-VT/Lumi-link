import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    socket = io(base, { transports: ['websocket'], path: '/socket.io' });
  }
  return socket;
}


