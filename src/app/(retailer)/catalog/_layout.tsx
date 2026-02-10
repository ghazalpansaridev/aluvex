import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo, BackButton } from '../../../components/ui';

/**
 * Stack layout for catalog screens
 * Enables proper navigation between catalog list and detail pages
 */
export default function CatalogLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Product Details',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
