import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo, BackButton } from '../../../components/ui';

export default function RegisterLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Register',
          headerTitle: () => <HeaderLogo />,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
