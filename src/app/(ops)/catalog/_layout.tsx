import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui';

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
          headerTitle: () => <HeaderLogo />,
        }}
      />
    </Stack>
  );
}
