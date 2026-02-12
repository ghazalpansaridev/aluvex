import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationItem } from '../../components/ui/NotificationItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../lib/auth-context';
import { notificationsApi } from '../../lib/notifications.api';
import { Notification } from '../../types';

export default function OpsNotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const data = await notificationsApi.fetchNotifications({
        userId: user.id,
        filter,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter, user]);

  const handleNotificationPress = async (notification: Notification) => {
    // Optimistic update - mark as read immediately in UI
    if (!notification.is_read) {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );

      try {
        await notificationsApi.markAsRead(notification.id);
        console.log('✅ Notification marked as read:', notification.id);
      } catch (error) {
        console.error('❌ Error marking as read:', error);
        loadNotifications();
      }
    }

    // Navigate to related entity
    if (notification.data?.related_entity_type && notification.data?.related_entity_id) {
      const { related_entity_type, related_entity_id } = notification.data;
      
      switch (related_entity_type) {
        case 'order':
          router.push(`/(ops)/orders/${related_entity_id}`);
          break;
        case 'user':
          router.push(`/(ops)/customers/${related_entity_id}`);
          break;
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    try {
      await notificationsApi.markAllAsRead(user.id);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'unread' ? "You don't have any unread notifications" : "No notifications"}
            message={filter === 'unread' ? undefined : "You don't have any notifications yet"}
            icon="notifications-outline"
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFF',
  },
  markAllButton: {
    marginLeft: 'auto',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
