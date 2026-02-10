import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../lib/auth-context';
import { useCart } from '../../hooks/useCart';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingSpinner, HeaderLogo, BackButton } from '../../components/ui';

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
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerLeft: () => <BackButton />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifs',
          headerLeft: () => <BackButton />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          headerLeft: () => <BackButton />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'card' : 'card-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerLeft: () => <BackButton />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          title: 'Checkout',
          headerLeft: () => <BackButton />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="order-confirmation"
        options={{
          title: 'Order Confirmation',
          headerLeft: () => <BackButton />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="contact-us"
        options={{
          title: 'Contact Us',
          headerLeft: () => <BackButton />,
          href: null,
        }}
      />
    </Tabs>
  );
}
