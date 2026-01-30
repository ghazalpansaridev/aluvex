import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole, RetailerStatus, Retailer } from '../types';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  role: UserRole | null;
  retailer: Retailer | null;
  retailerStatus: RetailerStatus | null;
  isPhoneVerified: boolean;
  loading: boolean;
  setPhoneVerified: (verified: boolean, saveToDB?: boolean) => Promise<void>;
  savePhoneVerificationForSignup: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRetailer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PHONE_VERIFICATION_KEY = '@phone_verification_status';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [retailerStatus, setRetailerStatus] = useState<RetailerStatus | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch retailer data for retailer users
  const fetchRetailerData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching retailer:', error);
        return null;
      }

      return data as Retailer | null;
    } catch (err) {
      console.error('Error in fetchRetailerData:', err);
      return null;
    }
  }, []);

  // Determine user role from metadata or retailer table
  const determineRole = useCallback(async (supabaseUser: SupabaseUser): Promise<{
    role: UserRole;
    retailer: Retailer | null;
    status: RetailerStatus | null;
  }> => {
    const metadata = supabaseUser.user_metadata || {};
    
    // Check if role is explicitly set in metadata (for admin, ops, sales)
    if (metadata.role && ['admin', 'operations', 'sales'].includes(metadata.role)) {
      return {
        role: metadata.role as UserRole,
        retailer: null,
        status: null,
      };
    }

    // Check if user is a retailer
    const retailerData = await fetchRetailerData(supabaseUser.id);
    
    if (retailerData) {
      return {
        role: 'retailer',
        retailer: retailerData,
        status: retailerData.status as RetailerStatus,
      };
    }

    // Default to retailer role for new signups (before registration complete)
    return {
      role: 'retailer',
      retailer: null,
      status: null,
    };
  }, [fetchRetailerData]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession?.user) {
        setUser(currentSession.user);
        
        // Determine role and fetch retailer data
        const { role: userRole, retailer: retailerData, status } = await determineRole(currentSession.user);
        setRole(userRole);
        setRetailer(retailerData);
        setRetailerStatus(status);
        
        // Check phone verification
        const phoneVerified = currentSession.user.user_metadata?.phone_verified === true;
        setIsPhoneVerified(phoneVerified);
        
        // Sync with AsyncStorage
        if (phoneVerified) {
          await AsyncStorage.setItem(PHONE_VERIFICATION_KEY, 'true');
        }
      } else {
        setUser(null);
        setRole(null);
        setRetailer(null);
        setRetailerStatus(null);
        setIsPhoneVerified(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  }, [determineRole]);

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      
      if (newSession?.user) {
        setUser(newSession.user);
        const { role: userRole, retailer: retailerData, status } = await determineRole(newSession.user);
        setRole(userRole);
        setRetailer(retailerData);
        setRetailerStatus(status);
        
        const phoneVerified = newSession.user.user_metadata?.phone_verified === true;
        setIsPhoneVerified(phoneVerified);
      } else {
        setUser(null);
        setRole(null);
        setRetailer(null);
        setRetailerStatus(null);
        setIsPhoneVerified(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, determineRole]);

  const refreshRetailer = async () => {
    if (user) {
      const retailerData = await fetchRetailerData(user.id);
      setRetailer(retailerData);
      setRetailerStatus(retailerData?.status as RetailerStatus || null);
    }
  };

  const setPhoneVerified = async (verified: boolean, saveToDB = true) => {
    try {
      await AsyncStorage.setItem(PHONE_VERIFICATION_KEY, verified.toString());
      setIsPhoneVerified(verified);
      
      if (saveToDB && verified && user) {
        const { error } = await supabase.auth.updateUser({
          data: { ...user.user_metadata, phone_verified: true },
        });
        
        if (!error) {
          const { data: { user: updatedUser } } = await supabase.auth.getUser();
          if (updatedUser) setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error setting phone verification:', error);
    }
  };

  const savePhoneVerificationForSignup = async (phoneNumber: string) => {
    if (!user) throw new Error('User not found');
    
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        phone_verified: true,
        phone_number: phoneNumber,
      },
    });
    
    if (error) throw error;
    
    setIsPhoneVerified(true);
    await AsyncStorage.setItem(PHONE_VERIFICATION_KEY, 'true');
    
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (updatedUser) setUser(updatedUser);
  };

  const logout = async () => {
    try {
      setSession(null);
      setUser(null);
      setRole(null);
      setRetailer(null);
      setRetailerStatus(null);
      setIsPhoneVerified(false);
      
      await AsyncStorage.removeItem(PHONE_VERIFICATION_KEY);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        retailer,
        retailerStatus,
        isPhoneVerified,
        loading,
        setPhoneVerified,
        savePhoneVerificationForSignup,
        logout,
        refreshRetailer,
      }}
    >
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
