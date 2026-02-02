import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  unreadCount: number;
  onPress: () => void;
}

export const NotificationBellIcon: React.FC<Props> = ({ unreadCount, onPress }) => {
  const showBadge = unreadCount > 0;
  
  console.log('🔔 [NotificationBellIcon] Rendering with unreadCount:', unreadCount, 'showBadge:', showBadge);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={26} color="#333" />
      {showBadge && (
        <View style={styles.badge}>
          {unreadCount <= 99 ? (
            <Text style={styles.badgeText}>{unreadCount}</Text>
          ) : (
            <Text style={styles.badgeText}>99+</Text>
          )}
        </View>
      )}
      {showBadge && <View style={styles.redDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
