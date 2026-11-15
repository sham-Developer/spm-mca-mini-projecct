import { io } from 'socket.io-client';
import API_URL from './config';

// Extract base server origin (strip /api)
const socketUrl = API_URL.replace(/\/api\/?$/, '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('Real-time live WebSocket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Real-time live WebSocket disconnected:', reason);
    });
  }
  return socket;
};

export default getSocket;

