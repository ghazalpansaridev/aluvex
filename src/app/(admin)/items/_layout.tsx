import { Stack } from 'expo-router';

export default function ItemsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Let the parent Tabs handle the header
      }}
    />
  );
}
