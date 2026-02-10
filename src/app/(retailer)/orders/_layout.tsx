import { Stack } from 'expo-router';
import { HeaderLogo, BackButton } from '../../../components/ui';

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Orders',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Order Details',
        }}
      />
    </Stack>
  );
}
