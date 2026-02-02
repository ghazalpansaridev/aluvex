import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnreadCount = async () => {
    if (!userId) {
      console.log('🔔 [useNotifications] No userId provided');
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log('🔔 [useNotifications] Fetching unread count for user:', userId);

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      console.log('🔔 [useNotifications] Query result:', { count, error });

      if (error) throw error;
      setUnreadCount(count || 0);
      console.log('🔔 [useNotifications] Unread count set to:', count || 0);
    } catch (err) {
      setError(err as Error);
      console.error('🔔 [useNotifications] Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔔 [useNotifications] Hook initialized with userId:', userId);
    fetchUnreadCount();

    if (!userId) return;

    // Real-time subscription with unique channel per user
    console.log('🔔 [useNotifications] Setting up real-time subscription for:', userId);
    const channelName = `notifications-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 [useNotifications] Real-time update received:', payload);
          console.log('🔔 [useNotifications] Refetching unread count...');
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useNotifications] Subscription status:', status);
      });

    return () => {
      console.log('🔔 [useNotifications] Cleaning up subscription for:', userId);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, loading, error, refreshUnreadCount: fetchUnreadCount };
}
