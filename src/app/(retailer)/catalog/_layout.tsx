import { Stack } from 'expo-router';

/**
 * Stack layout for catalog screens
 * Enables proper navigation between catalog list and detail pages
 */
export default function CatalogLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Product Details',
          headerBackTitle: 'Home',
        }}
      />
    </Stack>
  );
}
