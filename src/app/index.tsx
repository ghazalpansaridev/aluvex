import { Redirect } from 'expo-router';
import { useAuth } from './lib/auth-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';

export default function Index() {
  const { session, isPhoneVerified, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Wait for auth context to finish loading and give it a moment to update
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isPhoneVerified, session]);

  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // If no Supabase session, redirect to auth screen (login/signup)
  if (!session) {
    return <Redirect href="/auth" />;
  }

  // If session exists but phone not verified, redirect to phone auth
  if (session && !isPhoneVerified) {
    return <Redirect href="/phone-auth" />;
  }

  // Both session and phone verified, go to categories
  return <Redirect href="/categories" />;
}

