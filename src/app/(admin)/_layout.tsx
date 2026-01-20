import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { LoadingSpinner } from '../../components/ui';

export default function AdminLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders' }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: 'Users' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}
