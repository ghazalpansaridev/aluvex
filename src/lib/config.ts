import Constants from 'expo-constants';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getConfig(): Config {
  // Try to get from Constants.expoConfig.extra first (from app.config.js)
  // Fallback to process.env since Expo automatically exposes EXPO_PUBLIC_* vars
  const extra = Constants.expoConfig?.extra as Config | undefined;
  
  const supabaseUrl = extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file and restart the Expo dev server.'
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const config = getConfig();
