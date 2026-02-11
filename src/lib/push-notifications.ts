import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Try to load Firebase messaging on Android only.
// Wrapped in try/catch - if native module isn't ready, we fall back to Expo push.
let messaging: (() => any) | null = null;

if (Platform.OS === 'android') {
  try {
    const mod = require('@react-native-firebase/messaging');
    messaging = mod?.default ?? null;
    if (messaging) {
      console.log('✅ [Push] Firebase messaging loaded');
    }
  } catch (e: any) {
    console.warn('⚠️ [Push] Firebase messaging not available, using Expo push:', e.message);
    messaging = null;
  }
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotifications = {
  /**
   * Register for push notifications.
   * Android: tries FCM first, falls back to Expo push.
   * iOS: uses Expo push.
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('📱 Push notifications only work on physical devices');
      return null;
    }

    try {
      // Request notification permissions
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

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      // Try FCM on Android
      if (Platform.OS === 'android' && messaging) {
        try {
          const fcmToken = await this.registerFCM(userId);
          if (fcmToken) return fcmToken;
          console.log('⚠️ [Push] FCM failed, falling back to Expo push');
        } catch (e: any) {
          console.warn('⚠️ [Push] FCM error, falling back to Expo push:', e.message);
        }
      }

      // Expo push (default for iOS, fallback for Android)
      return this.registerExpo(userId);
    } catch (error: any) {
      console.error('❌ Error in registerForPushNotifications:', error);
      return null;
    }
  },

  async registerFCM(userId: string): Promise<string | null> {
    if (!messaging) return null;

    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === 1 || authStatus === 2; // AUTHORIZED or PROVISIONAL
    if (!enabled) {
      console.log('❌ [Push] FCM permission denied');
      return null;
    }

    const token = await messaging().getToken();
    if (!token) {
      console.log('❌ [Push] FCM token is empty');
      return null;
    }

    console.log('✅ [Push] FCM token:', token.substring(0, 30) + '...');
    await this.savePushToken(userId, token, 'fcm');
    return token;
  },

  async registerExpo(userId: string): Promise<string | null> {
    console.log('🔑 Getting Expo push token...');

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '73bf7a68-d40a-49ab-baf8-f69c8bf1dd77',
      });
    } catch {
      try {
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (e: any) {
        console.error('❌ Expo push token failed:', e.message);
        return null;
      }
    }

    const token = tokenData.data;
    console.log('✅ Expo push token:', token);
    await this.savePushToken(userId, token, 'expo');
    return token;
  },

  async savePushToken(userId: string, token: string, kind: 'fcm' | 'expo'): Promise<void> {
    const deviceInfo = {
      platform: Platform.OS,
      deviceName: Device.deviceName,
      osVersion: Device.osVersion,
    };

    console.log('💾 Saving push token...', { userId, kind, token: token.substring(0, 20) + '...' });

    const row: Record<string, any> = {
      user_id: userId,
      device_info: deviceInfo,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (kind === 'fcm') {
      row.fcm_token = token;
      row.expo_push_token = null;
    } else {
      row.expo_push_token = token;
      row.fcm_token = null;
    }

    const onConflict = kind === 'fcm' ? 'user_id,fcm_token' : 'user_id,expo_push_token';
    const { error } = await supabase.from('push_tokens').upsert(row, { onConflict });

    if (error) {
      console.error('❌ Error saving push token:', error);
    } else {
      console.log('✅ Push token saved');
    }
  },

  async removePushToken(userId: string, token: string): Promise<void> {
    // Try both columns
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .or(`expo_push_token.eq.${token},fcm_token.eq.${token}`);

    if (error) {
      console.error('Error removing push token:', error);
    }
  },

  setupNotificationHandlers(onNotificationReceived?: (notification: Notifications.Notification) => void) {
    // FCM foreground handler on Android
    if (Platform.OS === 'android' && messaging) {
      try {
        const unsubMessage = messaging().onMessage(async (remoteMessage: any) => {
          console.log('FCM foreground message:', remoteMessage);
          if (onNotificationReceived && remoteMessage.data) {
            onNotificationReceived({
              request: {
                content: {
                  data: remoteMessage.data,
                  title: remoteMessage.notification?.title,
                  body: remoteMessage.notification?.body,
                },
              },
            } as Notifications.Notification);
          }
        });

        const unsubOpened = messaging().onNotificationOpenedApp((remoteMessage: any) => {
          console.log('FCM notification tapped:', remoteMessage);
          if (remoteMessage.data && onNotificationReceived) {
            onNotificationReceived({
              request: { content: { data: remoteMessage.data } },
            } as Notifications.Notification);
          }
        });

        messaging().getInitialNotification().then((remoteMessage: any) => {
          if (remoteMessage?.data && onNotificationReceived) {
            onNotificationReceived({
              request: { content: { data: remoteMessage.data } },
            } as Notifications.Notification);
          }
        });

        // Also listen for Expo notifications (local notifications, etc.)
        const receivedSub = Notifications.addNotificationReceivedListener((n) => {
          console.log('Expo notification received:', n);
          onNotificationReceived?.(n);
        });
        const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
          console.log('Expo notification tapped:', r);
        });

        return () => {
          unsubMessage();
          unsubOpened();
          receivedSub.remove();
          responseSub.remove();
        };
      } catch (e: any) {
        console.warn('⚠️ FCM handler setup failed, using Expo only:', e.message);
      }
    }

    // Expo notification handlers (iOS + fallback)
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      return data;
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
