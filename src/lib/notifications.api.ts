import { supabase } from './supabase';
import { Notification, NotificationType } from '../types';

export interface FetchNotificationsParams {
  userId: string;
  filter?: 'all' | 'unread';
  limit?: number;
  offset?: number;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: {
    related_entity_type?: string;
    related_entity_id?: string;
    [key: string]: any;
  };
}

export const notificationsApi = {
  // Fetch notifications with optional filtering
  async fetchNotifications({ userId, filter = 'all', limit = 20, offset = 0 }: FetchNotificationsParams) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  },

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Mark single notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Create notification (admin/ops only)
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Send notification with push via Edge Function
  async sendNotificationWithPush(params: CreateNotificationParams): Promise<void> {
    console.log('📤 [Notification] Invoking send-notification Edge Function...');
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      },
    });

    if (error) {
      console.error('❌ [Notification] Edge Function error:', error);
      throw error;
    }
    
    console.log('✅ [Notification] Edge Function response:', data);
  },
};
