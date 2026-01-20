import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { LoadingSpinner } from '../../components/ui';

export default function SalesLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (role !== 'sales' && role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{ title: 'Catalog' }}
      />
      <Tabs.Screen
        name="retailers"
        options={{ title: 'Retailers' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}
