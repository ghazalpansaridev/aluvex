import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { LoadingSpinner } from '../../components/ui';

export default function OpsLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (role !== 'ops' && role !== 'admin') {
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
        name="orders"
        options={{ title: 'Orders' }}
      />
      <Tabs.Screen
        name="items"
        options={{ title: 'Items' }}
      />
      <Tabs.Screen
        name="sellers"
        options={{ title: 'Sellers' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}
