import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [offlineAlerts, setOfflineAlerts] = useState([]);

  useEffect(() => {
    let newSocket = null;
    
    const connectSocket = () => {
      // Clean up existing socket if any
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }

      // Create new socket connection - use relative URL for Docker compatibility
      const socketUrl = window.location.origin;
      newSocket = io(socketUrl, {
        transports: ['websocket'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
        withCredentials: true
    });

      // Set up event handlers
    newSocket.on('connect', () => {
      console.log('🔗 Connected to server via Socket.IO');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
    });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket.IO reconnection attempt #${attemptNumber}`);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      });

      newSocket.on('reconnect_failed', () => {
        console.log('❌ Socket.IO reconnection failed after all attempts');
        // Try to establish a new connection after a delay
        setTimeout(connectSocket, 5000);
      });

      // Handle offline locker alerts
      newSocket.on('lockers-offline', (data) => {
        console.log('📴 Lockers went offline:', data);
        const newAlert = {
          id: Date.now(),
          type: 'offline',
          message: `${data.count} locker(s) went offline: ${data.lockers.join(', ')}`,
          timestamp: new Date()
        };
        setOfflineAlerts(prev => [...prev, newAlert]);
        
        // Auto-remove alert after 10 seconds
        setTimeout(() => {
          setOfflineAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
        }, 10000);
      });

    setSocket(newSocket);
    };

    // Initial connection
    connectSocket();

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up Socket.IO connection...');
        newSocket.removeAllListeners();
      newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, offlineAlerts }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext }; 