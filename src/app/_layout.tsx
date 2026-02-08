import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { DrawerProvider } from '../lib/drawer-context';
import { supabase } from '../lib/supabase';
import { GlobalDrawer } from '../components/ui';
import { pushNotifications } from '../lib/push-notifications';

function PushNotificationInitializer() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [PushInit] useEffect triggered, user:', user ? `${user.id.substring(0, 8)}...` : 'null');
    
    if (user) {
      console.log('✅ [PushInit] User authenticated, starting push registration...');
      
      // Register for push notifications (async but don't wait)
      pushNotifications.registerForPushNotifications(user.id)
        .then((token) => {
          if (token) {
            console.log('🎉 [PushInit] Push registration successful!');
          } else {
            console.log('⚠️ [PushInit] Push registration returned null (check logs above)');
          }
        })
        .catch((error) => {
          console.error('❌ [PushInit] Push registration failed:', error);
        });

      // Setup handlers
      const cleanup = pushNotifications.setupNotificationHandlers((notification) => {
        // Handle foreground notification
        const data = notification.request.content.data as any;
        
        // Navigate based on notification data
        if (data?.related_entity_type && data?.related_entity_id) {
          const role = user.user_metadata?.role;
          const { related_entity_type, related_entity_id } = data;
          
          if (role === 'admin') {
            if (related_entity_type === 'order') {
              router.push(`/(admin)/orders/${related_entity_id}`);
            } else if (related_entity_type === 'user') {
              router.push(`/(admin)/users/${related_entity_id}`);
            }
          } else if (role === 'operations') {
            if (related_entity_type === 'order') {
              router.push(`/(ops)/orders/${related_entity_id}`);
            } else if (related_entity_type === 'user') {
              router.push(`/(ops)/sellers/${related_entity_id}`);
            }
          } else if (role === 'sales') {
            if (related_entity_type === 'order') {
              router.push(`/(sales)/orders/${related_entity_id}`);
            } else if (related_entity_type === 'user') {
              router.push(`/(sales)/retailers/${related_entity_id}`);
            }
          } else {
            // Retailer
            if (related_entity_type === 'order') {
              router.push(`/(retailer)/orders/${related_entity_id}`);
            } else if (related_entity_type === 'payment') {
              router.push('/(retailer)/payments');
            }
          }
        }
      });

      return cleanup;
    }
  }, [user, router]);

  return null;
}

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
      <PushNotificationInitializer />
      <DrawerProvider>
        <GlobalDrawer>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(retailer)" />
            <Stack.Screen name="(ops)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(sales)" />
            <Stack.Screen 
              name="catalog-guest" 
              options={{ 
                title: 'Home',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="categories" 
              options={{ 
                headerShown: true,
              }} 
            />
          </Stack>
        </GlobalDrawer>
      </DrawerProvider>
    </AuthProvider>
  );
}
