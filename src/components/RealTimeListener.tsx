'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealTimeListener({ event }: { event: string }) {
  const router = useRouter();

  useEffect(() => {
    // Use standard HTTP Server Sent Events (SSE) instead of WebSockets
    // This is much more reliable behind proxies and Cloudflare
    const eventSource = new EventSource('/api/realtime');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === event || data.event === 'dashboard') {
          console.log('Real-time update received via SSE:', data.event);
          router.refresh();
        }
      } catch (err) {
        // ignore parse errors (like heartbeats)
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection lost, retrying...');
    };

    return () => {
      eventSource.close();
    };
  }, [event, router]);

  return null;
}
