import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: true,
          title: 'Register',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen name="phone-verify" options={{ title: 'Verify Phone' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
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
    </Stack>
  );
}
