import { Stack } from 'expo-router';

/**
 * Stack layout for sales catalog screens
 */
export default function SalesCatalogLayout() {
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
