import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider } from '../lib/auth-context';
import { DrawerProvider } from '../lib/drawer-context';
import { supabase } from '../lib/supabase';
import { GlobalDrawer } from '../components/ui';

export default function RootLayout() {
  useEffect(() => {
    // Handle deep linking for mobile (password reset, email confirmation, etc.)
    if (Platform.OS !== 'web') {
      const handleDeepLink = async (event: { url: string }) => {
        const url = event.url;
        console.log('Deep link received:', url);
        
        // Parse the URL to extract tokens
        const parsedUrl = Linking.parse(url);
        const { queryParams } = parsedUrl;
        
        // Check if this is a password reset link
        if (queryParams && 'access_token' in queryParams && 'refresh_token' in queryParams) {
          console.log('Password reset link detected');
          
          // Set the session with the tokens from the URL
          await supabase.auth.setSession({
            access_token: queryParams.access_token as string,
            refresh_token: queryParams.refresh_token as string,
          });
        }
      };

      // Listen for deep links
      const subscription = Linking.addEventListener('url', handleDeepLink);

      // Check if app was opened with a deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return (
    <AuthProvider>
      <DrawerProvider>
        <GlobalDrawer>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(retailer)" />
            <Stack.Screen name="(ops)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(sales)" />
          </Stack>
        </GlobalDrawer>
      </DrawerProvider>
    </AuthProvider>
  );
}
