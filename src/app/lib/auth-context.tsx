import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isVerified: boolean;
  loading: boolean;
  setVerified: (verified: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VERIFICATION_KEY = '@phone_verification_status';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check verification status on mount
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(VERIFICATION_KEY);
      setIsVerified(status === 'true');
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const setVerified = async (verified: boolean) => {
    try {
      await AsyncStorage.setItem(VERIFICATION_KEY, verified.toString());
      setIsVerified(verified);
    } catch (error) {
      console.error('Error setting verification status:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(VERIFICATION_KEY);
      setIsVerified(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Don't block rendering while loading - let children handle it
  return (
    <AuthContext.Provider value={{ isVerified, loading, setVerified, logout }}>
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

