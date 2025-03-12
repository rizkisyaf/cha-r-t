import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

let socket = null;
let isConnected = false;

export const initSocket = (callbacks = {}) => {
  if (socket) {
    socket.disconnect();
  }
  
  try {
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ['websocket', 'polling']
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      isConnected = true;
      if (callbacks.onConnect) {
        callbacks.onConnect();
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      isConnected = false;
      if (callbacks.onDisconnect) {
        callbacks.onDisconnect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected = false;
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    });
    
    // Chat events
    socket.on('chat_response', (data) => {
      if (callbacks.onChatResponse) {
        callbacks.onChatResponse(data);
      }
    });
    
    // Error events
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    });
    
    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    return null;
  }
};

export const sendChatMessage = (message, chartContext) => {
  if (!socket || !isConnected) {
    console.warn('Socket not connected, cannot send message');
    return false;
  }
  
  try {
    socket.emit('chat_message', { message, chartContext });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
      socket = null;
      isConnected = false;
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  }
};

export default {
  initSocket,
  sendChatMessage,
  disconnectSocket,
}; 