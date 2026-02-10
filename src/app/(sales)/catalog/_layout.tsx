import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui';

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
          headerTitle: () => <HeaderLogo />,
        }}
      />
    </Stack>
  );
}
