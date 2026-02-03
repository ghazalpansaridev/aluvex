import { Stack } from 'expo-router';

/**
 * Stack layout for admin catalog screens
 */
export default function AdminCatalogLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
