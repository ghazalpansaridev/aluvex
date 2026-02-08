import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
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
    console.log('🚀 [Push] Starting registration for user:', userId);
    console.log('🚀 [Push] Platform:', Platform.OS);
    console.log('🚀 [Push] Device.isDevice:', Device.isDevice);
    
    // In production builds, sometimes Device.isDevice is false even on physical devices
    // We'll try to register anyway and let the permission request fail if needed
    if (!Device.isDevice && __DEV__) {
      console.log('📱 Push notifications only work on physical devices (skipping in dev mode)');
      return null;
    }

    try {
      // Request permissions
      console.log('🔔 [Push] Checking existing permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 [Push] Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔔 [Push] Requesting permissions from user...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔔 [Push] Permission request result:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ [Push] Permission denied by user');
        console.log('❌ [Push] Please enable notifications in device settings');
        Alert.alert(
          '❌ Push Notifications Disabled',
          'Please enable notifications in device settings to receive push notifications.',
          [{ text: 'OK' }]
        );
        return null;
      }

      console.log('✅ [Push] Permission granted');

      // Get Expo push token with projectId from config
      console.log('🔑 [Push] Getting Expo push token...');
      
      let tokenData;
      try {
        // For standalone builds, use the projectId from app.config.js
        tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'c3b4d61e-f7ae-449d-a4db-1e90130f02ed'
        });
        console.log('✅ [Push] Token obtained with projectId');
      } catch (tokenError: any) {
        console.error('❌ [Push] Error with projectId, trying without:', tokenError.message);
        
        // Fallback: try without projectId
        try {
          tokenData = await Notifications.getExpoPushTokenAsync();
          console.log('✅ [Push] Token obtained without projectId');
        } catch (fallbackError: any) {
          console.error('❌ [Push] Both token methods failed:', fallbackError.message);
          Alert.alert(
            '❌ Token Generation Failed',
            `Could not get Expo push token:\n\n${fallbackError.message}`,
            [{ text: 'OK' }]
          );
          return null;
        }
      }

      const token = tokenData.data;
      console.log('✅ [Push] Token retrieved:', token?.substring(0, 30) + '...');

      // Save token to database
      console.log('💾 [Push] Saving token to database...');
      try {
        await this.savePushToken(userId, token);
        console.log('✅ [Push] Token saved to database');
        
        // Configure for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#007AFF',
          });
          console.log('✅ [Push] Android notification channel configured');
        }

        console.log('🎉 [Push] Registration completed successfully!');
        
        // Success alert
        Alert.alert(
          '✅ Push Notifications Enabled',
          `Token registered successfully!\n\nToken: ${token.substring(0, 40)}...`,
          [{ text: 'OK' }]
        );
        
        return token;
      } catch (saveError: any) {
        console.error('❌ [Push] Failed to save token:', saveError);
        Alert.alert(
          '❌ Token Save Failed',
          `Permission granted and token obtained, but database save failed:\n\n${saveError.message || saveError}`,
          [{ text: 'OK' }]
        );
        return null;
      }
    } catch (error: any) {
      console.error('❌ [Push] CRITICAL ERROR in registerForPushNotifications:');
      console.error('❌ [Push] Error message:', error.message);
      console.error('❌ [Push] Error stack:', error.stack);
      
      Alert.alert(
        '❌ Push Registration Error',
        `Unexpected error during registration:\n\n${error.message || error}`,
        [{ text: 'OK' }]
      );
      
      return null;
    }
  },

  async savePushToken(userId: string, token: string): Promise<void> {
    const deviceInfo = {
      platform: Platform.OS,
      deviceName: Device.deviceName,
      osVersion: Device.osVersion,
    };

    console.log('💾 [Push] Saving token to database:', {
      userId: userId.substring(0, 8) + '...',
      tokenPrefix: token.substring(0, 30) + '...',
      deviceInfo,
    });

    const { data, error } = await supabase
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
      )
      .select();

    if (error) {
      console.error('❌ [Push] Database error saving token:');
      console.error('❌ [Push] Error code:', error.code);
      console.error('❌ [Push] Error message:', error.message);
      console.error('❌ [Push] Error details:', error.details);
      console.error('❌ [Push] Error hint:', error.hint);
      
      const errorMsg = `Code: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || 'none'}\nHint: ${error.hint || 'none'}`;
      throw new Error(errorMsg);
    } else {
      console.log('✅ [Push] Token saved successfully to database');
      console.log('✅ [Push] Database response:', data);
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
