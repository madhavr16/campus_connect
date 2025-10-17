import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_SOCKET || 'http://localhost:5000';
const socket = io(SOCKET_URL, { autoConnect: false });

export function connect() { if (!socket.connected) socket.connect(); return socket; }
export default socket;
