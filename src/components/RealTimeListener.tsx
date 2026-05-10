'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';

export default function RealTimeListener({ event }: { event: string }) {
  const router = useRouter();

  useEffect(() => {
    // If we are on a custom domain without a port (like service.ntsexp.local),
    // we should connect to the same origin. 
    // If we are on a specific IP/localhost with port 3000, we use 3001.
    const isStandardPort = window.location.port === '3000' || window.location.port === '';
    const socketUrl = window.location.port === '3000' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : window.location.origin; // In production/proxy, it's usually the same domain

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'], // Force WebSocket, skip polling to avoid 400 Bad Request
      secure: window.location.protocol === 'https:',
      rejectUnauthorized: false // Useful for self-signed or local certificates
    });

    socket.on(event, () => {
      console.log('Real-time update received:', event);
      router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [event, router]);

  return null;
}
