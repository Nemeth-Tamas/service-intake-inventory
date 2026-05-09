'use client';

import { pusherClient } from '@/lib/pusher';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RealTimeListener({ channel }: { channel: string }) {
  const router = useRouter();

  useEffect(() => {
    pusherClient.subscribe(channel);
    
    pusherClient.bind('update', () => {
      router.refresh();
    });

    return () => {
      pusherClient.unsubscribe(channel);
      pusherClient.unbind('update');
    };
  }, [channel, router]);

  return null;
}
