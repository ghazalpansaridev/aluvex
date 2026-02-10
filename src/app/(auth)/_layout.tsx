import React from 'react';
import { Stack } from 'expo-router';
import { HeaderLogo, BackButton } from '../../components/ui';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ 
        headerShown: true, 
        headerTitle: () => <HeaderLogo />,
        headerLeft: () => <BackButton />,
      }} />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen name="phone-verify" options={{ 
        title: 'Verify Phone', 
        headerTitle: () => <HeaderLogo />,
        headerLeft: () => <BackButton />,
      }} />
      <Stack.Screen name="forgot-password" options={{ 
        title: 'Forgot Password', 
        headerTitle: () => <HeaderLogo />,
        headerLeft: () => <BackButton />,
      }} />
      <Stack.Screen 
        name="reset-password" 
        options={{ 
          title: 'Reset Password',
          headerShown: true,
          headerTitle: () => <HeaderLogo />,
          headerLeft: () => <BackButton />,
        }} 
      />
      <Stack.Screen 
        name="verification-pending" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="rejected" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="set-password" 
        options={{ 
          title: 'Set Password',
          headerShown: true,
          headerTitle: () => <HeaderLogo />,
          headerLeft: () => <BackButton />,
          gestureEnabled: false,
        }} 
      />
    </Stack>
  );
}
