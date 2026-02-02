import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  notification: Notification;
  onPress: () => void;
}

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    order_placed: 'cart-outline',
    order_shipped: 'airplane-outline',
    order_cancelled: 'close-circle-outline',
    payment_recorded: 'cash-outline',
    credit_limit_updated: 'wallet-outline',
    account_approved: 'checkmark-circle-outline',
    account_rejected: 'close-circle-outline',
    low_stock_alert: 'warning-outline',
    new_order: 'bag-handle-outline',
    new_retailer: 'person-add-outline',
    custom: 'notifications-outline',
  };
  return iconMap[type] || 'notifications-outline';
};

export const NotificationItem: React.FC<Props> = ({ notification, onPress }) => {
  const isUnread = !notification.is_read;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unreadContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getNotificationIcon(notification.type)} 
          size={24} 
          color={isUnread ? '#007AFF' : '#8E8E93'} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isUnread && styles.unreadText]} numberOfLines={1}>
            {notification.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        
        {notification.body && (
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  unreadContainer: {
    backgroundColor: '#F2F2F7',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});
