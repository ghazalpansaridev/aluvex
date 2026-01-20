import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { config } from './config'

const supabaseUrl = config.supabaseUrl
const supabaseAnonKey = config.supabaseAnonKey

// Simple storage adapter using AsyncStorage directly
// This avoids SecureStore compatibility issues
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error('Error setting item in storage:', error)
      throw error
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from storage:', error)
      throw error
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
