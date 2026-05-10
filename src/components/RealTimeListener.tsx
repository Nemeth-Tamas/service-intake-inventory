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
        if (!e.data || e.data === 'heartbeat') return;
        
        const data = JSON.parse(e.data);
        console.log('SSE Received:', data);

        // React if it's the dashboard event or matches our specific work order
        const isMatch = data.event === 'dashboard' || 
                        data.event === event || 
                        (data.event && data.event.includes(event));

        if (isMatch) {
          console.log('Match found! Refreshing...');
          router.refresh();
        }
      } catch (err) {
        // Heartbeats or malformed data - ignore
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
