import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { HamburgerMenu, HamburgerIcon } from './HamburgerMenu';
import { DrawerContent } from './DrawerContent';
import { NotificationBellIcon } from './NotificationBellIcon';
import { useDrawer } from '../../lib/drawer-context';
import { useAuth } from '../../lib/auth-context';
import { useNotifications } from '../../hooks/useNotifications';

export const GlobalDrawer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useDrawer();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id || null);
  const router = useRouter();

  const handleNotificationPress = () => {
    // Navigate to notifications screen based on role
    if (user) {
      const role = user.user_metadata?.role;
      if (role === 'admin') {
        router.push('/(admin)/notifications');
      } else if (role === 'operations') {
        router.push('/(ops)/notifications');
      } else if (role === 'sales') {
        router.push('/(sales)/notifications');
      } else {
        router.push('/(retailer)/notifications');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon container - bell above hamburger */}
      <View style={styles.iconsContainer}>
        <NotificationBellIcon 
          unreadCount={unreadCount} 
          onPress={handleNotificationPress}
        />
        <HamburgerIcon onPress={openDrawer} color="#333" />
      </View>

      {/* Main content */}
      {children}

      {/* Slide-out drawer */}
      <HamburgerMenu isOpen={isDrawerOpen} onClose={closeDrawer}>
        <DrawerContent onClose={closeDrawer} />
      </HamburgerMenu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'column', // Stack vertically
    alignItems: 'center',
  },
});
