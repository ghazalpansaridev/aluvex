require('dotenv').config();

// Debug: Log environment variables
console.log('Loading environment variables...');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
console.log('EXPO_PUBLIC_PROJECT_ID:', process.env.EXPO_PUBLIC_PROJECT_ID ? '✓ Set' : '✗ Not Set (OK for Expo Go)');

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
    newArchEnabled: true,
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
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      googleServicesFile: "./google-services.json",
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
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#007AFF",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "#{unread_notifications} new notifications"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "73bf7a68-d40a-49ab-baf8-f69c8bf1dd77"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    },
  },
};


