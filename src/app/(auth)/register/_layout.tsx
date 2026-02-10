import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui';

export default function RegisterLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Register',
          headerBackTitle: 'Back',
          headerTitle: () => <HeaderLogo />,
        }}
      />
    </Stack>
  );
}
