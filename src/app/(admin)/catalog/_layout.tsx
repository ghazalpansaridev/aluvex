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
          title: 'Catalog',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
