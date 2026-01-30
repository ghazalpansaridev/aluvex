import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { config } from './config'

const supabaseUrl = config.supabaseUrl
const supabaseAnonKey = config.supabaseAnonKey

// Debug: Log credentials (remove in production)
console.log('Supabase Config:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length,
  keyStart: supabaseAnonKey?.substring(0, 20) + '...',
});

// Get the correct redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  const scheme = Constants.expoConfig?.scheme || 'myapp1208';
  return `${scheme}://`;
};

// Create Supabase client for auth operations with proper deep linking
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable auto-detection of auth flow (handles password reset links)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable URL hash detection for password reset
    // Use implicit flow for web (better compatibility with password reset)
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
  },
})

// Direct database operations helper (bypasses storage issues)
export const supabaseDb = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          }
        });
        const data = await response.json();
        return { data: response.ok ? data : null, error: response.ok ? null : data };
      } catch (error) {
        return { data: null, error };
      }
    },
    insert: async (values: any) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(values)
        });
        
        if (!response.ok) {
          const error = await response.json();
          return { data: null, error };
        }
        
        return { data: null, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    update: async (values: any) => ({
      eq: async (column: string, value: any) => {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(values)
          });
          
          if (!response.ok) {
            const error = await response.json();
            return { data: null, error };
          }
          
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }),
    delete: () => ({
      eq: async (column: string, value: any) => {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            }
          });
          
          if (!response.ok) {
            const error = await response.json();
            return { data: null, error };
          }
          
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }),
  })
}
