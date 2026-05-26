'use client';

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
