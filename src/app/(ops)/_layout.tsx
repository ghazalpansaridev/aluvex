import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingSpinner } from '../../components/ui';

export default function OpsLayout() {
  const { role, loading, user } = useAuth();
  const { unreadCount } = useNotifications(user?.id || null);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (role !== 'operations' && role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#333',
        headerShown: true,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          paddingHorizontal: 0,
          paddingLeft: 0,
          paddingRight: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          width: '100%',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          paddingHorizontal: 0,
          flex: 1,
          maxWidth: '25%',
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ 
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sellers"
        options={{ 
          title: 'Sellers',
          tabBarLabel: 'Sellers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ 
          title: 'Notifications',
          tabBarLabel: 'Notifs',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{ 
          title: 'Items',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ 
          title: 'Settings',
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

