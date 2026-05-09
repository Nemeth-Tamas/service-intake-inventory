'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';

export default function RealTimeListener({ event }: { event: string }) {
  const router = useRouter();

  useEffect(() => {
    // Dynamic origin for local network support
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
    const socket = io(socketUrl);

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
