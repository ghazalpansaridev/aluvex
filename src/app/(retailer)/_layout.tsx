import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { LoadingSpinner } from '../../components/ui';

export default function RetailerLayout() {
  const { role, retailerStatus, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Protect retailer routes
  if (role !== 'retailer' || retailerStatus !== 'approved') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <TabIcon name="cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => <TabIcon name="credit-card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Simple tab icon component (replace with proper icon library)
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    grid: '🏪',
    cart: '🛒',
    list: '📋',
    'credit-card': '💳',
    settings: '⚙️',
  };
  return <Text style={{ fontSize: 20, color }}>{icons[name] || '•'}</Text>;
}
