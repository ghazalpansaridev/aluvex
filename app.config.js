require('dotenv').config();

// Debug: Log environment variables (remove in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('Loading environment variables...');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
}

module.exports = {
  expo: {
    name: "Fittmart",
    scheme: "fittmart",
    slug: "fittmart",
    owner: "ghazalp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.fittmart.app",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "POST_NOTIFICATIONS"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      "@react-native-firebase/app",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#007AFF",
          sounds: []
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "73bf7a68-d40a-49ab-baf8-f69c8bf1dd77"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
