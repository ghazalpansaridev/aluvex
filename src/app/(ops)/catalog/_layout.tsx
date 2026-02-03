import { Stack } from 'expo-router';

/**
 * Stack layout for ops catalog screens
 */
export default function OpsCatalogLayout() {
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
