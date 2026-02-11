import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

// FCM only on Android (native module). Use module for statics (AuthorizationStatus).
const firebaseMessaging = Platform.OS === 'android'
  ? require('@react-native-firebase/messaging')
  : null;
const messaging = firebaseMessaging?.default ?? null;
const AuthorizationStatus = firebaseMessaging?.AuthorizationStatus ?? null;

// Configure notification handler (used for display when FCM delivers to foreground on Android too)
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

    if (!Device.isDevice && __DEV__) {
      console.log('📱 Push notifications only work on physical devices (skipping in dev mode)');
      return null;
    }

    try {
      if (Platform.OS === 'android' && messaging) {
        return this.registerFCM(userId);
      }
      return this.registerExpo(userId);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      console.error('❌ [Push] CRITICAL ERROR in registerForPushNotifications:', err.message, err.stack);
      Alert.alert(
        '❌ Push Registration Error',
        `Unexpected error:\n\n${err.message ?? String(error)}`,
        [{ text: 'OK' }]
      );
      return null;
    }
  },

  async registerFCM(userId: string): Promise<string | null> {
    try {
      const authStatus = await messaging().requestPermission();
      const authorized = AuthorizationStatus
        ? (authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL)
        : (authStatus === 1 || authStatus === 2); // 1=AUTHORIZED, 2=PROVISIONAL
      const enabled = authorized;
      if (!enabled) {
        console.log('❌ [Push] FCM permission denied');
        Alert.alert(
          '❌ Push Notifications Disabled',
          'Please enable notifications in device settings to receive push notifications.',
          [{ text: 'OK' }]
        );
        return null;
      }
      console.log('✅ [Push] FCM permission granted');

      const token = await messaging().getToken();
      if (!token) {
        console.error('❌ [Push] FCM token is empty');
        return null;
      }
      console.log('✅ [Push] FCM token retrieved:', token.substring(0, 30) + '...');

      await this.savePushToken(userId, token, 'fcm');
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }
      console.log('🎉 [Push] FCM registration completed');
      Alert.alert(
        '✅ Push Notifications Enabled',
        `FCM token registered successfully!\n\nToken: ${token.substring(0, 40)}...`,
        [{ text: 'OK' }]
      );
      return token;
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('❌ [Push] FCM registration failed:', e.message);
      Alert.alert(
        '❌ FCM Token Failed',
        `Could not get FCM token:\n\n${e.message ?? String(err)}`,
        [{ text: 'OK' }]
      );
      return null;
    }
  },

  async registerExpo(userId: string): Promise<string | null> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        '❌ Push Notifications Disabled',
        'Please enable notifications in device settings.',
        [{ text: 'OK' }]
      );
      return null;
    }

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'c3b4d61e-f7ae-449d-a4db-1e90130f02ed',
      });
    } catch {
      try {
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (fallbackError: unknown) {
        const e = fallbackError as { message?: string };
        Alert.alert('❌ Token Generation Failed', `Expo push token:\n\n${e.message ?? String(fallbackError)}`, [{ text: 'OK' }]);
        return null;
      }
    }
    const token = tokenData.data;
    await this.savePushToken(userId, token, 'expo');
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
      });
    }
    Alert.alert('✅ Push Notifications Enabled', `Token registered!\n\n${token.substring(0, 40)}...`, [{ text: 'OK' }]);
    return token;
  },

  async savePushToken(userId: string, token: string, kind: 'fcm' | 'expo'): Promise<void> {
    const deviceInfo = {
      platform: Platform.OS,
      deviceName: Device.deviceName,
      osVersion: Device.osVersion,
    };

    if (kind === 'fcm') {
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            fcm_token: token,
            expo_push_token: null,
            device_info: deviceInfo,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,fcm_token' }
        )
        .select();
      if (error) {
        console.error('❌ [Push] Database error saving FCM token:', error);
        throw new Error(error.message);
      }
      return;
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          expo_push_token: token,
          fcm_token: null,
          device_info: deviceInfo,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      )
      .select();
    if (error) {
      console.error('❌ [Push] Database error saving Expo token:', error);
      throw new Error(error.message);
    }
  },

  async removePushToken(userId: string, token: string, kind?: 'fcm' | 'expo'): Promise<void> {
    const column = kind === 'fcm' ? 'fcm_token' : 'expo_push_token';
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq(column, token);
    if (error) console.error('Error removing push token:', error);
  },

  setupNotificationHandlers(onNotificationReceived?: (notification: Notifications.Notification) => void) {
    if (Platform.OS === 'android' && messaging) {
      const unsubMessage = messaging().onMessage(async (remoteMessage: { data?: Record<string, string>; notification?: { title?: string; body?: string } }) => {
        console.log('Notification received (FCM foreground):', remoteMessage);
        if (onNotificationReceived && remoteMessage.data) {
          const synthetic = {
            request: {
              content: {
                data: remoteMessage.data,
                title: remoteMessage.notification?.title,
                body: remoteMessage.notification?.body,
              },
            },
          } as Notifications.Notification;
          onNotificationReceived(synthetic);
        }
      });
      const unsubOpened = messaging().onNotificationOpenedApp((remoteMessage: { data?: Record<string, string> }) => {
        console.log('Notification tapped (FCM):', remoteMessage);
        if (remoteMessage.data) {
          onNotificationReceived?.({
            request: { content: { data: remoteMessage.data } },
          } as Notifications.Notification);
        }
      });
      messaging().getInitialNotification().then((remoteMessage: { data?: Record<string, string> } | null) => {
        if (remoteMessage?.data) {
          onNotificationReceived?.({
            request: { content: { data: remoteMessage.data } },
          } as Notifications.Notification);
        }
      });
      return () => {
        unsubMessage();
        unsubOpened();
      };
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data as Record<string, string>;
      if (data && onNotificationReceived) {
        onNotificationReceived({ request: { content: { data } } } as Notifications.Notification);
      }
    });
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
