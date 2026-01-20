import { Stack } from 'expo-router';
import { AuthProvider } from './lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(retailer)" />
        <Stack.Screen name="(ops)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(sales)" />
      </Stack>
    </AuthProvider>
  );
}
