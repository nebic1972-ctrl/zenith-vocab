'use client';

import { useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export default function SyncManager() {
  const processQueue = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    for (const task of queue) {
      try {
        if (task.action === 'UPDATE_PROGRESS') {
          const { bookId, progress } = task.payload as {
            bookId: string;
            progress: number;
          };
          const { error } = await supabase
            .from('books')
            .update({
              progress,
              last_read: new Date(task.timestamp).toISOString(),
            })
            .eq('id', bookId);
          if (error) throw error;
        }
        if (task.id != null) await db.syncQueue.delete(task.id);
      } catch (e) {
        console.error('Sync hatası:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      toast('Bağlantı sağlandı. Veriler senkronize ediliyor.', {
        icon: <RefreshCw size={16} className="animate-spin shrink-0" />,
      });
      processQueue();
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) void processQueue();

    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  return null;
}
