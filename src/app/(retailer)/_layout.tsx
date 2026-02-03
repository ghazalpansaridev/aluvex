import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { useCart } from '../../hooks/useCart';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingSpinner } from '../../components/ui';

export default function RetailerLayout() {
  const { role, retailerStatus, loading, user } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications(user?.id || null);

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
        tabBarInactiveTintColor: '#333',
        headerShown: true,
        tabBarStyle: {
          height: Platform.OS === 'web' ? 60 : 65,
          paddingBottom: Platform.OS === 'web' ? 8 : 10,
          paddingTop: Platform.OS === 'web' ? 8 : 8,
          padding: 0,
          margin: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          elevation: 0,
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
          padding: 0,
          margin: 0,
          flex: 1,
          width: '20%',
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
        name="cart"
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size || 24} color={color} />
          ),
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
        name="payments"
        options={{
          title: 'Payments',
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          title: 'Checkout',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="order-confirmation"
        options={{
          title: 'Order Confirmation',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          title: 'Order Details',
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

