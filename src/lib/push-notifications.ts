import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotifications = {
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('📱 Push notifications only work on physical devices');
      return null;
    }

    try {
      // Request permissions
      console.log('🔔 Requesting push notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return null;
      }

      console.log('✅ Push notification permission granted');

      // Get Expo push token
      // For Expo Go in development, try without projectId first
      console.log('🔑 Getting Expo push token...');
      
      let tokenData;
      try {
        // Try without projectId first (works for Expo Go in most cases)
        tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('✅ Push token obtained successfully (without projectId)');
      } catch (tokenError: any) {
        console.error('❌ Error getting push token:', tokenError.message);
        
        // Check if it's a projectId issue
        if (tokenError.message?.includes('projectId') || tokenError.message?.includes('uuid')) {
          console.log('');
          console.log('📱 Push notifications in Expo Go have limitations.');
          console.log('');
          console.log('💡 Options to fix this:');
          console.log('');
          console.log('   Option 1: Use EAS Build (Recommended for Production)');
          console.log('   - Run: npx expo install expo-dev-client');
          console.log('   - Run: eas build --profile development --platform ios');
          console.log('   - This creates a standalone app with full push support');
          console.log('');
          console.log('   Option 2: Test Without Push Notifications');
          console.log('   - In-app notifications work perfectly');
          console.log('   - Use local notifications for testing UI');
          console.log('   - Configure push later when ready for production');
          console.log('');
          console.log('⚠️  For now, in-app notifications will continue to work normally.');
        }
        
        return null;
      }

      const token = tokenData.data;
      console.log('✅ Push token obtained:', token);

      // Save token to database
      await this.savePushToken(userId, token);
      console.log('✅ Push token saved to database');

      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
        console.log('✅ Android notification channel configured');
      }

      return token;
    } catch (error: any) {
      console.error('❌ Error in registerForPushNotifications:', error);
      return null;
    }
  },

  async savePushToken(userId: string, token: string): Promise<void> {
    const deviceInfo = {
      platform: Platform.OS,
      deviceName: Device.deviceName,
      osVersion: Device.osVersion,
    };

    console.log('💾 Saving push token to database...', {
      userId,
      tokenPrefix: token.substring(0, 20) + '...',
      deviceInfo,
    });

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          expo_push_token: token,
          device_info: deviceInfo,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      );

    if (error) {
      console.error('❌ Error saving push token:', error);
    } else {
      console.log('✅ Push token saved successfully');
    }
  },

  async removePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('expo_push_token', token);

    if (error) {
      console.error('Error removing push token:', error);
    }
  },

  setupNotificationHandlers(onNotificationReceived?: (notification: Notifications.Notification) => void) {
    // Handle notification received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Navigation handled in _layout.tsx
      return data;
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
