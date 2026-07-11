import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://mind-vs-coin.onrender.com/', {
  autoConnect: false,
  transports: ['websocket']
});

export default socket;
