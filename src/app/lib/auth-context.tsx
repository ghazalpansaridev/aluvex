import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isPhoneVerified: boolean;
  loading: boolean;
  setPhoneVerified: (verified: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PHONE_VERIFICATION_KEY = '@phone_verification_status';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPhoneVerificationStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(PHONE_VERIFICATION_KEY);
      const verified = status === 'true';
      setIsPhoneVerified(verified);
      console.log('Phone verification status checked:', verified);
      return verified;
    } catch (error) {
      console.error('Error checking phone verification status:', error);
      setIsPhoneVerified(false);
      return false;
    }
  };

  useEffect(() => {
    // Check phone verification status on mount and when session changes
    const initializeAuth = async () => {
      await checkPhoneVerificationStatus();
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Re-check phone verification when session changes
      if (session) {
        await checkPhoneVerificationStatus();
      } else {
        setIsPhoneVerified(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setPhoneVerified = async (verified: boolean) => {
    try {
      console.log('Setting phone verified to:', verified);
      await AsyncStorage.setItem(PHONE_VERIFICATION_KEY, verified.toString());
      setIsPhoneVerified(verified);
      // Double-check to ensure it was saved
      const status = await AsyncStorage.getItem(PHONE_VERIFICATION_KEY);
      console.log('Phone verification status after setting:', status);
      if (status === verified.toString()) {
        setIsPhoneVerified(verified);
      }
    } catch (error) {
      console.error('Error setting phone verification status:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Clear local state FIRST - this is critical for navigation to work
      setSession(null);
      setUser(null);
      setIsPhoneVerified(false);
      console.log('Local state cleared immediately');
      
      // Clear phone verification status
      await AsyncStorage.removeItem(PHONE_VERIFICATION_KEY);
      console.log('Phone verification status cleared');
      
      // Sign out from Supabase - this triggers onAuthStateChange
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Supabase signOut error:', signOutError);
      } else {
        console.log('Supabase session cleared');
      }
      
      // Explicitly clear Supabase auth storage keys
      try {
        const keys = await AsyncStorage.getAllKeys();
        const supabaseKeys = keys.filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') ||
          (key.includes('auth') && !key.includes('phone'))
        );
        for (const key of supabaseKeys) {
          try {
            await AsyncStorage.removeItem(key);
            console.log('Cleared storage key:', key);
          } catch (err) {
            console.log('Error clearing key:', key, err);
          }
        }
      } catch (e) {
        console.log('Error getting keys:', e);
      }
      
      console.log('Logout completed');
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure state is cleared even on error
      setSession(null);
      setUser(null);
      setIsPhoneVerified(false);
      try {
        await AsyncStorage.removeItem(PHONE_VERIFICATION_KEY);
      } catch (e) {
        console.error('Error clearing phone verification:', e);
      }
    }
  };

  // Don't block rendering while loading - let children handle it
  return (
    <AuthContext.Provider value={{ session, user, isPhoneVerified, loading, setPhoneVerified, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

