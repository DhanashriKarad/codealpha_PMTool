import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found for WebSocket connection');
      return;
    }

    console.log('Initializing WebSocket connection...');
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'] // Add polling as fallback
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    // Add ping/pong to keep connection alive
    newSocket.on('pong', (latency) => {
      console.log('WebSocket ping/pong latency:', latency, 'ms');
    });

    setSocket(newSocket);

    return () => {
      console.log('Closing WebSocket connection');
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const joinProject = (projectId) => {
    if (socket && isConnected && projectId) {
      console.log(`Joining project room: project-${projectId}`);
      socket.emit('join-project', projectId);
    } else {
      console.log('Cannot join project: Socket not connected');
    }
  };

  const leaveProject = (projectId) => {
    if (socket && isConnected && projectId) {
      console.log(`Leaving project room: project-${projectId}`);
      socket.emit('leave-project', projectId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinProject,
    leaveProject
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};