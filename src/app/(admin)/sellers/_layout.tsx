import { Stack } from 'expo-router';
import { HeaderLogo, BackButton } from '../../../components/ui';

export default function AdminSellersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
