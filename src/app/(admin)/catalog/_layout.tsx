import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui';

/**
 * Stack layout for admin catalog screens
 */
export default function AdminCatalogLayout() {
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
