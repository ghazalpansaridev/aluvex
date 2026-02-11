import Constants from 'expo-constants';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  projectId?: string;
}

function getConfig(): Config {
  // In standalone builds, environment variables are passed through Constants.expoConfig.extra
  // In Expo Go/development, they're available through process.env
  const extra = Constants.expoConfig?.extra;
  
  const supabaseUrl = 
    extra?.supabaseUrl || 
    process.env.EXPO_PUBLIC_SUPABASE_URL || 
    '';
    
  const supabaseAnonKey = 
    extra?.supabaseAnonKey || 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
    '';

  const projectId = 
    extra?.eas?.projectId || 
    extra?.projectId || 
    process.env.EXPO_PUBLIC_PROJECT_ID;

  // Log for debugging (helps diagnose issues on real devices)
  console.log('📱 Config Initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    hasProjectId: !!projectId,
    urlStart: supabaseUrl?.substring(0, 30) + '...',
    source: extra?.supabaseUrl ? 'Constants.extra' : 'process.env'
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `❌ Missing Supabase configuration!
    
URL: ${supabaseUrl ? '✓' : '✗ Missing'}
Key: ${supabaseAnonKey ? '✓' : '✗ Missing'}

This usually means:
1. Environment variables not set on EAS (run: eas env:create)
2. .env file missing locally
3. app.config.js not passing variables to 'extra'

Debug info:
- Constants.extra exists: ${!!extra}
- process.env available: ${!!process.env.EXPO_PUBLIC_SUPABASE_URL}`;
    
    console.error(errorMsg);
    throw new Error('Missing Supabase configuration. Check console for details.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    projectId,
  };
}

export const config = getConfig();
