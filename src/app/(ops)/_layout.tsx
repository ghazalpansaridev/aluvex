import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { LoadingSpinner } from '../../components/ui';

export default function OpsLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (role !== 'operations' && role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5856D6',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{ 
          title: 'Catalog',
          tabBarLabel: 'Catalog',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{ 
          title: 'Items',
          tabBarLabel: 'Items',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ 
          title: 'Orders',
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="sellers"
        options={{ 
          title: 'Sellers',
          tabBarLabel: 'Sellers',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ 
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}
